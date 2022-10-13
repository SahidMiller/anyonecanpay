import { encode as encodeDagPb, decode as decodeDagPb } from "@ipld/dag-pb"

import last from "it-last";
import * as IPFS from 'ipfs';
import { MemoryDatastore } from 'datastore-core';
import { MemoryBlockstore } from 'blockstore-core';

import { createRepo } from 'ipfs-repo';
import { MemoryLock } from 'ipfs-repo/locks/memory'
import * as rawCodec from 'multiformats/codecs/raw';
import { signMessage, verifyMessage } from '@ipfs-flipstarter/utils/helpers';

export async function createSignedManifest(source, address, wif) {

  const repo = createRepo(
    '',
    async () => rawCodec,
    {
      blocks: new MemoryBlockstore(),
      datastore: new MemoryDatastore(),
      keys: new MemoryDatastore(),
      pins: new MemoryDatastore(),
      root: new MemoryDatastore()
    },
    { autoMigrate: false, repoLock: MemoryLock, repoOwner: true }
  );

  /** @type {import('ipfs').IPFS} */
  const ipfs = await IPFS.create({
    repo, 
    offline: true,
    silent: true,
    repoAutoMigrate: false,
    init: { allowNew: true },
    start: false,
  });

  const { cid } = await last(ipfs.addAll(source, {
    cidVersion: 0,
    trickle: false,
    hash:  'sha2-256',
  }));

  /** @type {import('@ipld/dag-pb').PBNode} */
  const dagPbNode = (await ipfs.dag.get(cid)).value;
  const dag = Buffer.from(encodeDagPb(dagPbNode)).toString('hex');
  const signature = signMessage(wif, dag);
  const verify = verifyMessage(address, signature, dag);
  const manifestData = JSON.stringify({ dag, signature, address });
  
  await ipfs.stop();

  if (verify) {
    
    //Create a signed manifest.json to include in final build
    return manifestData;

  } else {
    console.error("Could not verify message was signed by address using the provided key");
  }
}