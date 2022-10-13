import { createLink, createNode, encode } from '@ipld/dag-pb';
import { CID } from 'multiformats/cid';

/**
 * 
 * @param {import('ipfs').IPFS} ipfs ipfs node
 * @param {import('@ipld/dag-pb').PBNode} baseDag ipfs dag node
 * @param {*} campaignData campaign data
 * @returns 
 */
export async function create(
  ipfs:import('ipfs').IPFS, 
  baseDag:import('@ipld/dag-pb').PBNode, 
  campaignData:any, 
  { signal }:{ signal?:AbortSignal } = {}
) {
  const data = { ...campaignData, version: "0.0.1" };
  const { cid, size } = await ipfs.add(JSON.stringify(data), { preload: false, signal });
  const campaignLink = createLink("campaign.json", size, cid);

  const baseLinks = baseDag.Links.filter((link) => link.Name !== 'campaign.json');
  const clientDagNode = createNode(baseDag.Data, [...baseLinks, campaignLink]);

  return await ipfs.dag.put(clientDagNode, { storeCodec: 'dag-pb', preload: false, signal });
}

export async function validate(
  ipfs:import('ipfs').IPFS, 
  baseDag:import('@ipld/dag-pb').PBNode, 
  campaignData:any, 
  expectedCid:CID|string
) {
  try {
    const { cid: expectedCampaignJsonCid, size: expectedCampaignJsonSize } = await ipfs.add(JSON.stringify(campaignData), { onlyHash: true });
    const expectedCampaignJsonLink = createLink("campaign.json", expectedCampaignJsonSize, expectedCampaignJsonCid);

    //Add link to baseClientDag
    const expectedCampaignDagNode = createNode(baseDag.Data, [...baseDag.Links, expectedCampaignJsonLink]);

    //Hash the result
    const hasher = await ipfs.hashers.getHasher("sha2-256");
    const expectedCampaignRawDag = encode(expectedCampaignDagNode);
    const expectedCampaignDagHash = await hasher.digest(expectedCampaignRawDag);
    const expectedCampaignDagCid = CID.createV0(expectedCampaignDagHash);

    return { success: expectedCampaignDagCid.toString() !== expectedCid.toString() };

  } catch (error) {

    return { success: false, error };
  }
}