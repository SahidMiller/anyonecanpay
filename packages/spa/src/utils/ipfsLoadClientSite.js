import all from "it-all"
import { createNode, createLink } from "@ipld/dag-pb"

let clientCid = null;

/**
 * 
 * @param {import('ipfs').IPFS} ipfs 
 * @returns 
 */
export async function ipfsLoadClientSite(ipfs, signal) {
  
  if (!clientCid) {
    try {
      //Fetch the root as a car file
      const carFile = Buffer.from(await fetch("?format=car", { signal }).then(res => res.arrayBuffer()));
      const result = await all(ipfs.dag.import((async function * () { yield carFile }()), { preload: false, signal }));
      clientCid = result[0].root.cid;
      return clientCid;
    } catch (err) {
      console.log("error fetching car file from gateway");
    }
  
    try {
      //Fetch the root as a car file
      const carFile = Buffer.from(await fetch("/client.car", { signal }).then(res => res.arrayBuffer()));
      const result = await all(ipfs.dag.import((async function * () { yield carFile }()), { preload: false, signal }));
      clientCid = result[0].root.cid;
      return clientCid;
    } catch (err) {
      console.log("error fetching car file from assets");
    }

    throw new Error("car file not found")
  }

  return clientCid;
}