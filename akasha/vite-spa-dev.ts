import chokidar, { FSWatcher } from 'chokidar';
import { ResolvedConfig, Plugin } from 'vite';
import { WebSocketServer } from 'ws';
import { createServer, Server } from "https";
import { existsSync, statSync, createReadStream, readFileSync } from 'fs';
import mime from 'mime';
import path from 'path';
import { EventName } from 'chokidar/handler.js';
import { createHash } from 'crypto';

export const chunkFromId = (id: string) => {
    return `${id
      .split('/')
      .slice(id.split('/').indexOf('src'), id.split('/').length + 1)
      .join('_')
      .replaceAll('.tsx', '')
      .replaceAll('.ts', '')
      .replaceAll('.js', '')}`;
  }

export type HMRPluginOptions = {
    targetFilePath: string;
    server: {
        https?: boolean;
        host: string;
        port: number;
        hmrTopic: string;
    }
}
type WatcherPayload = {
    topic: string;
    changeType: EventName;
    path: string;
    rootComponentPath: string;
}
const enum ChangeTypes {
    ADD = 'add',
    UNLINK = 'unlink',
    CHANGE = 'change',
}

let fileHashes: { [key: string]: string } = {};

function getFileHash(filePath: string): string {
    const fileBuffer = readFileSync(filePath);
    const hashSum = createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

export const ViteSpaDev = (opt: HMRPluginOptions): Plugin => {
    const options = opt;
    let config: ResolvedConfig;
    let wsServer: WebSocketServer;
    let fileWatcher: FSWatcher;
    let server: Server;
    return {
        name: 'hmr-dev',
        apply: 'build',
        configResolved(resolved: ResolvedConfig) {
            config = resolved;
        },
        async transform(code, id) {
            const packageJSON = await import('./package.json');

            /**
             * Patch the styling by adding the extension's name
             * This is required to avoid overwriting the global styles
             */
            if (id.endsWith('.css')) {
                const transformed: string[] = [];
                for (const line of code.split('\n')) {
                    let newLine: string = line;
                    
                    if (line === ':root {') {
                        newLine = `#${packageJSON.name} {`;
                    }
                    
                    if (line === '.dark {') {
                        newLine = `.dark #${packageJSON.name} {`;
                    }

                    transformed.push(newLine);
                }
                return `${transformed.join('\n')}`;
            }

            if (id.endsWith(options.targetFilePath)) {
                
                return `
                ${code}
                if (__DEV__) {
                    const safeSystemDelete = (path) => {
                        if (System.has(path)) {
                            System.delete(path);
                        }
                    }

                    let debounceTimeout = null;

                    const debounce = (fn, delay) => {
                        return (...args) => {
                            clearTimeout(debounceTimeout);
                            debounceTimeout = setTimeout(() => fn(...args), delay);
                        }
                    }

                    const projectName = '${packageJSON.name}';
                    const wsNamespace = '${packageJSON.name}_ws';

                    const listenHMR = async () => {
                        global[wsNamespace] = new WebSocket('${options.server.https ? 'wss' : 'ws'}://localhost:${options.server.port}');
                        global[wsNamespace].addEventListener('open', async () => {
                            console.info('HMR - enabled. Make sure you create an app with Extension ID: ${packageJSON.name}');
                            console.info('Please consult the docs for more info: https://docs.akasha.world/devkit/');
                        });

                        global[wsNamespace].addEventListener('error', (event) => {
                            console.warn('HMR - WebSocket failed to connect');
                        });

                        if (!System) return;

                        const sspa = await System.import(System.resolve('single-spa'));

                        if (!sspa) {
                            console.warn('Cannot update modules. Required package "single-spa" not found');
                            return;
                        }

                        const reloadApp = debounce(async () => {
                            await sspa.unloadApplication(projectName);
                        }, 250);

                        global[wsNamespace].addEventListener('message', async (event) => {
                            try {
                                const { topic, changeType, path, rootComponentPath } = JSON.parse(event.data);
                                if (topic === '${options.server.hmrTopic}') {
                                    safeSystemDelete(path);
                                    if (changeType === '${ChangeTypes.ADD}' || changeType === '${ChangeTypes.CHANGE}') {
                                        await System.import(path);
                                    }
                                    if (changeType !== '${ChangeTypes.UNLINK}') {
                                        safeSystemDelete(rootComponentPath);
                                        reloadApp();
                                    }
                                }
                            } catch(err) {
                                console.warn('HMR - failed to reload.', err);
                            }
                        });

                        global[wsNamespace].addEventListener('close', () => {
                            console.log('HMR - connection closed. will retry in 3s');
                            setTimeout(() => {
                                listenHMR();
                            }, 3000);
                        });
                    }

                    if (typeof WebSocket !== 'undefined' && typeof global[wsNamespace] === 'undefined') {
                        listenHMR();
                    }
                }
          `;
            }
            return code;
        },
        async closeBundle() {
            const isHTTPSServer = Boolean(options.server.https);
            const srvURI = 'localhost';
            const srvUrl = `${isHTTPSServer ? 'https://' : 'http://'}${srvURI}:${options.server.port}`;
            const packageJSON = await import('./package.json');
            let { output } = config.build.rollupOptions;
            if (output && Array.isArray(output)) {
                output = output[0];
            }
            const entryFile = output?.entryFileNames;
            const outDir = config.build.outDir;

            const mainFile = `${srvUrl}/${outDir}/${entryFile}`;
            const rootComponentPath = `${srvUrl}/${outDir}/${chunkFromId(`src/${options.targetFilePath}`)}.js`;

            if (!wsServer) {
                server = createServer({
                    cert: config.server.https?.cert,
                    key: config.server.https?.key
                }, (req, res) => {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');
                    if (!req.url) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        return res.end(`File not found: ${req.url}`);
                    }
                    
                    let filePath = path.join(process.cwd(), req.url);
                    
                    if (existsSync(filePath) && statSync(filePath).isFile()) {
                        // wrong or no mimetype messes up with system (or single-spa) :|
                        res.writeHead(200, { 'Content-Type': mime.getType(filePath) || 'application/octet-stream' });

                        createReadStream(filePath)
                            .pipe(res);
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end(`File not found: ${req.url}`);
                    }
                });

                wsServer = new WebSocketServer({ server });

                const rollupOutput = config.build.rollupOptions.output;
                if (typeof rollupOutput === 'object' && !Array.isArray(rollupOutput)) {
                    fileWatcher = chokidar.watch(`${config.build.outDir}`, {
                        usePolling: true,
                        alwaysStat: true,
                        awaitWriteFinish: true,
                        interval: 50,
                    });

                    fileWatcher.on('add', (path, stats) => {
                        const fileHash = getFileHash(path);
                        fileHashes[path] = fileHash;

                        wsServer.clients.forEach(wsClient => {
                            if (wsClient.readyState === 1) {

                                const payload: WatcherPayload = {
                                    topic: options.server.hmrTopic,
                                    changeType: ChangeTypes.ADD,
                                    path: `${srvUrl}/${path}`,
                                    rootComponentPath,
                                }

                                wsClient.send(JSON.stringify(payload));
                            }
                        })
                    });
                    
                    fileWatcher.on('change', (path) => {
                        const currentFileHash = getFileHash(path);
                        if (fileHashes[path] && currentFileHash === fileHashes[path]) return;
                        fileHashes[path] = currentFileHash;
                        
                        wsServer.clients.forEach(wsClient => {
                            if (wsClient.readyState === 1) {
                                
                                const payload: WatcherPayload = {
                                    topic: options.server.hmrTopic,
                                    changeType: ChangeTypes.CHANGE,
                                    path: `${srvUrl}/${path}`,
                                    rootComponentPath
                                }
                                
                                wsClient.send(JSON.stringify(payload));
                            }
                        })
                    });

                    fileWatcher.on('unlink', (path) => {
                        delete fileHashes[path];

                        wsServer.clients.forEach(wsClient => {
                            if (wsClient.readyState === 1) {
                                
                                const payload: WatcherPayload = {
                                    topic: options.server.hmrTopic,
                                    changeType: ChangeTypes.UNLINK,
                                    path: `${srvUrl}/${path}`,
                                    rootComponentPath,
                                }
                                
                                wsClient.send(JSON.stringify(payload));
                            }
                        });
                    });
                }

                process.on('SIGINT', () => {
                    console.info('\nHMR - Stopping processes');
                    fileWatcher.close();
                    wsServer.close();
                    process.exit();
                });

                server.listen(options.server.port, options.server.host, () => {
                    console.info(`
*********************************************************
    ▗▄▄▄▖▗▖  ▗▖▗▄▄▄▖▗▄▄▄▖▗▖  ▗▖ ▗▄▄▖▗▄▄▄▖ ▗▄▖ ▗▖  ▗▖
    ▐▌    ▝▚▞▘   █  ▐▌   ▐▛▚▖▐▌▐▌     █  ▐▌ ▐▌▐▛▚▖▐▌
    ▐▛▀▀▘  ▐▌    █  ▐▛▀▀▘▐▌ ▝▜▌ ▝▀▚▖  █  ▐▌ ▐▌▐▌ ▝▜▌
    ▐▙▄▄▖▗▞▘▝▚▖  █  ▐▙▄▄▖▐▌  ▐▌▗▄▄▞▘▗▄█▄▖▝▚▄▞▘▐▌  ▐▌
                                                                                
            ▗▄▄▄  ▗▄▄▄▖▗▖  ▗▖▗▖ ▗▖▗▄▄▄▖▗▄▄▄▖
            ▐▌  █ ▐▌   ▐▌  ▐▌▐▌▗▞▘  █    █  
            ▐▌  █ ▐▛▀▀▘▐▌  ▐▌▐▛▚▖   █    █  
            ▐▙▄▄▀ ▐▙▄▄▖ ▝▚▞▘ ▐▌ ▐▌▗▄█▄▖  █  
                                    
*********************************************************
`);
    console.log('\x1b[36m%s\x1b[0m', 'Documentation: \x1b[0m','https://docs.akasha.world/devkit');
    console.log('');
    console.log('\x1b[36m%s\x1b[0m', 'Server: \x1b[0m', `${options.server.https ? 'https' : 'http'}://${options.server.host}:${options.server.port}`);
    console.log('\x1b[36m%s\x1b[0m', 'Extension ID: \x1b[0m', `${packageJSON.name}`);
    console.log('\x1b[36m%s\x1b[0m','MainFile: \x1b[0m', `${mainFile}`);
    console.log('');
    console.log('🔴 Please open MainFile url (from above) in your browser to make sure that the index file loads.');
    console.log('');
    console.log('*********************************************************');
                });
            }
        }
    }
}
