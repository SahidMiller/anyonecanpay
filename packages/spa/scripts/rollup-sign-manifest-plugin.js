import fs from 'fs'
import path from 'path'
import globSource from 'ipfs-utils/src/files/glob-source.js';
import { createSignedManifest } from "./generate-signed-manifest.mjs"

async function* getSource(target) {
  const absolutePath = path.resolve(target);
  const dirName = path.basename(absolutePath);
  const pattern = '**/*';

  for await (const content of globSource(target, pattern)) {
    if (!/(\/|\\)manifest.json$/.test(content.path)) {
      yield {
        ...content,
        path: `${ dirName }${ content.path }`
      };
    }
  }
}

export default function signManifest({ address, wif } = {}) {
  const name = 'signManifest';
  return {
    name: name,
    writeBundle: async (options) => { 
      console.log("Building manifest.");

      if (!address) {
        console.warn("Missing variable \"address\". Skipping manifest build.")
        return;
      }

      if (!wif) {
        console.warn("Missing variable \"wif\". Skipping manifest build.")
        return;
      }

      const source = getSource(options.dir);
      const destination = path.join(options.dir, "manifest.json");    
      const manifestData = await createSignedManifest(source, address, wif);
      
      fs.writeFileSync(destination, manifestData);

      console.log("Finished manifest.");
    }
  };
};