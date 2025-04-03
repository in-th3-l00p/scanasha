import { existsSync, readFileSync } from 'fs';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { Composite } from "@composedb/devtools";
import {
  createComposite,
  readEncodedComposite,
  writeEncodedComposite,
  writeEncodedCompositeRuntime,
} from "@composedb/devtools-node";
import dotenv from 'dotenv';
import { updateCeramicConfig } from "./update-ceramic-conf.mjs";
import { createDirIfNotExist, generateAdminKeyDid, writeToEnvFile, createDID } from "./utils.mjs";

const DEFINITION_PATH = "./src/api/__generated__";
const COMPOSITES_PATH = "./composedb/composites";
const CERAMIC_CONFIG_PATH = './.devcontainer/data/ceramic_daemon/daemon.config.json'

dotenv.config();

const run = async () => {
    // asuming that we are running in dev container
    const ceramic = new CeramicClient('http://localhost:7007');
    if (!process.env.DID_ADMIN_PRIVATE_KEY) {
        // there is no admin key, generate one and update the 
        // .env and the ceramic node config files
        const {seed, did} = await generateAdminKeyDid();
        process.env.DID_ADMIN_PRIVATE_KEY = seed;

        if (existsSync(CERAMIC_CONFIG_PATH)) {
            // ceramic container was started at least once and the config was generated
            if (!updateCeramicConfig(CERAMIC_CONFIG_PATH, did.id)) {
                console.error('Failed to update ceramic config');
                process.exit(1);
            }
        } else {
            // ceramic was never started so we'll notify the user and exit
            console.log('Ceramic not started yet!');
            console.log('Please start the ceramic container at least once to generate the config file.');
            process.exit(1);
        }

        if (existsSync('./.env')) {
            // the env exists so we need to append to it
            writeToEnvFile('./.env', `DID_ADMIN_PRIVATE_KEY=${seed}\n`, true);
        } else {
            // we'll create the env file witht he admin key
            writeToEnvFile('./.env', `DID_ADMIN_PRIVATE_KEY=${seed}\n`, false);
        }
        // ceramic needs a restart to pick up new config
        console.error('******* RESTART REQURED *******');
        console.log('');
        console.log('A new DID_ADMIN_PRIVATE_KEY has been generated and added to the .env file.');
        console.log('Please restart the ceramic container to apply the changes!');
        console.log('');
        console.log('After the restart, please run the same script again!');
        console.log('');
        console.error('********************************');
        process.exit(0);
    }
    // this might be executed after restart
    ceramic.did = await createDID(process.env.DID_ADMIN_PRIVATE_KEY);

    try {
        // poll composite
        const pollComposite = await createComposite(
            ceramic,
            `${COMPOSITES_PATH}/01-poll.graphql`
        );
        // vote composite
        const voteSchema = readFileSync(`${COMPOSITES_PATH}/02-vote.graphql`, { encoding: 'utf8' }).replace("$POLL_ID", pollComposite.modelIDs[0]);
        const voteComposite = await Composite.create({
            ceramic,
            schema: voteSchema,
        });

        // review composite
        const reviewComposite = await createComposite(
            ceramic,
            `${COMPOSITES_PATH}/03-review.graphql`
        );

        const composite = Composite.from([pollComposite, voteComposite, reviewComposite]);

        createDirIfNotExist(`${DEFINITION_PATH}/`);

        await writeEncodedComposite(composite, `${DEFINITION_PATH}/runtime-definition.json`);

        await writeEncodedCompositeRuntime(
            ceramic,
            `${DEFINITION_PATH}/runtime-definition.json`,
            `${DEFINITION_PATH}/definition.js`
        );

        const deployComposite = await readEncodedComposite(ceramic, `${DEFINITION_PATH}/runtime-definition.json`);

        await deployComposite.startIndexingOn(ceramic);
        
        console.log('**************');
        console.log('');
        console.log('Composites compiled and deployed successfully!')
        console.log('');
        console.log('**************');

    } catch (error) {
        console.error('Failed to compile composites:', error);
        process.exit(1);
    }
}

run().catch(err => console.error('Failed to compile and deploy:', err));