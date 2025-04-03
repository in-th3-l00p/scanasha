import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import externalGlobals from 'rollup-plugin-external-globals';
import createExternal from 'vite-plugin-external';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { chunkFromId, ViteSpaDev } from './vite-spa-dev';
import tailwindcss from '@tailwindcss/vite';

const HMR_UPDATE_TOPIC = 'hmr-update';

export default defineConfig(({ mode }) => {
  const isProd = mode !== 'development';
  return {
    plugins: [
      react(),
      tailwindcss(),
      basicSsl({
        name: 'devkit-ssl',
        domains: ['localhost'],
        certDir: path.resolve(__dirname, '.devcontainer/ssl'),
      }),
      createExternal({
        externals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@akashaorg/core-sdk': '@akashaorg/core-sdk',
          '@akashaorg/ui-core-hooks': '@akashaorg/ui-core-hooks',
        },
      }),
      ...(isProd
        ? []
        : [
            ViteSpaDev({
              targetFilePath: 'components/index.tsx',
              server: {
                port: 8070,
                https: true,
                host: '0.0.0.0',
                hmrTopic: HMR_UPDATE_TOPIC,
              },
            }),
          ]),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    envPrefix: ['PUBLIC_', 'NODE_'],
    define: {
      __DEV__: !isProd,
    },
    build: {
      modulePreload: true,
      target: 'esnext',
      rollupOptions: {
        input: 'src/index.tsx',
        preserveEntrySignatures: 'strict',
        external: ['@akashaorg/core-sdk', '@akashaorg/ui-core-hooks', 'react', 'react-dom'],
        jsx: 'react-jsx',
        plugins: [
          externalGlobals({
            react: 'React',
            'react-dom': 'ReactDOM',
          }),
        ],
        output: {
          dir: 'dist',
          format: 'systemjs',
          entryFileNames: 'index.js',
          chunkFileNames: chunkInfo => {
            if (chunkInfo.name === 'vendor') {
              return 'vendor.js';
            }
            return `${chunkInfo.name}.js`;
          },
          inlineDynamicImports: false,
          experimentalMinChunkSize: Infinity,
          systemNullSetters: true,
          manualChunks: id => {
            if (id.includes('src') && !id.includes('/node_modules/')) {
              return chunkFromId(id);
            }
            return 'vendor';
          },
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
        onwarn: (warning, warn) => {
          if (
            warning.code === 'INVALID_ANNOTATION' &&
            (warning.id?.includes('/node_modules/graphql-scalars/esm/') ||
              warning.id?.includes('/node_modules/@akashaorg/ui-core-hooks/lib/generated/apollo'))
          ) {
            return;
          }
          return warn(warning);
        },
      },
      minify: isProd ? true : false,
      emptyOutDir: true,
    },
    optimizeDeps: {
      include: ['@composedb/client'],
    },
    logLevel: 'info' as const,
    clearScreen: true,
  };
});
