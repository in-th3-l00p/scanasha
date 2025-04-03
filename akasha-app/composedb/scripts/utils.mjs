import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { DID } from 'dids';
import { randomBytes } from "crypto";
import { toString } from "uint8arrays/to-string";
import { fromString } from 'uint8arrays/from-string';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from "key-did-resolver";

export const createDirIfNotExist = (filePath) => {
  const directory = dirname(filePath);
  if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
      console.log(`Created directory: ${directory}`);
  }
};

export const generateAdminKeyDid = async () => {
  const seed = new Uint8Array(randomBytes(32));
  const did = new DID({
    provider: new Ed25519Provider(seed),
    resolver: getResolver(),
  });
  await did.authenticate();
  return {
    seed: toString(seed, "base16"),
    did,
  };
};

export const createDID = async (adminKey) => {
  const privateKey = fromString(adminKey, 'base16')
  const did = new DID({
    provider: new Ed25519Provider(privateKey),
    resolver: getResolver(),
  })
  await did.authenticate()
  return did
}

export const writeToEnvFile = (path, data, append) => {
  writeFileSync(path, data, { flag: append ? 'a' : 'w' });
  console.log(`Env file updated: ${path}`);
  console.log(`Added: ${data}`);
}