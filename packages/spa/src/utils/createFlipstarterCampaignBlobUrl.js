import all from "it-all";

/**
 * 
 * @param {import('ipfs').IPFS} ipfs 
 * @param {import('ipfs').CID} cid 
 * @return {Promise<string>} url to car file blob
 */
export default async function createFlipstarterCampaignBlobUrl(ipfs, cid, { signal } = {}) {
  const carFile = await all(ipfs.dag.export(cid, { signal }));
  const blob = new Blob(carFile, {type:"octet/stream"});
  return window.URL.createObjectURL(blob);
}