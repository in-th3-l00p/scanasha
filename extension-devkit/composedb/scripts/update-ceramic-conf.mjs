import { readFileSync, writeFileSync } from 'fs';

export const updateCeramicConfig = (configPath, didToAdd) => {
    try {
      const configStr = readFileSync(configPath, 'utf8');
      const ceramicConf = JSON.parse(configStr);
      
      if (!ceramicConf['http-api']) {
        ceramicConf['http-api'] = {};
      }

      if (!ceramicConf['http-api']['admin-dids']) {
        ceramicConf['http-api']['admin-dids'] = [];
      }
      
      if (!ceramicConf['http-api']['admin-dids'].includes(didToAdd)) {
        ceramicConf['http-api']['admin-dids'].push(didToAdd);
      } else {
        console.log(`DID ${didToAdd} already exists in admin-dids`);
      }
      writeFileSync(configPath, JSON.stringify(ceramicConf, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Failed to update Ceramic config:`, error);
      return false;
    }
  };