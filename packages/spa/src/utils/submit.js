import { set } from 'idb-keyval';

import { SATS_PER_BCH } from './bitcoinCashUtilities.js';
import { ipfsLoadClientSite } from "./ipfsLoadClientSite.js";
import createFlipstarterCampaignBlobUrl from "./createFlipstarterCampaignBlobUrl.js";
import campaignStore from "./campaignStore.js";

import { FLIPSTARTER_CLIENT, FLIPSTARTER_CLIENT_IPNS, FLIPSTARTER_CLIENT_RECORD, DEFAULT_GATEWAY_URL } from "./constants.js"
import { CID } from "multiformats/cid";

export async function submit(campaignData, ipfs) {
  if (!ipfs) {
    throw new Error("submission requires ipfs");
  }

  if (process.env.NODE_ENV !== 'development') {
    if (!readOnly) {
      set("draft", undefined);
    }
  }

  try {

    //Following makes it not exactly reproducing previously created data.
    const { create:createFlipstarterCampaignSite } = (await import(/* webpackChunkName: 'createFlipstarter'*/'@ipfs-flipstarter/utils/ipfs/index.js'));
    const clientCid = await ipfsLoadClientSite(ipfs).catch(() => {
      //Allow IPFS nodes to fetch the content when default campaign car doesn't exist for us to give to them (only used if they don't already have it)
      // There's no fallback if they cannot fetch this client over IPFS.
      return CID.parse(FLIPSTARTER_CLIENT)
    });

    const clientDag = (await ipfs.dag.get(clientCid)).value;
    
    const campaign = {
      title: campaignData.title,
      image: campaignData.image,
      description: campaignData.description,
      recipients: campaignData.recipients.map((recipient) => {
        const bch = parseFloat(recipient.bch);
        const sats = Math.round(bch * SATS_PER_BCH);

        return {
          name: recipient.name,
          address: recipient.address,
          satoshis: sats,
        }
      }),
      clientConfig: {
        cid: clientCid.toString(),
        ipns: FLIPSTARTER_CLIENT_IPNS,
        record: FLIPSTARTER_CLIENT_RECORD
      }
    }

    if (campaignData.expires) {
      campaign.expires = Math.floor(new Date(campaignData.expires + "T23:59:59.999Z").getTime() / 1000)
    }

    //Connect to preload nodes before pushing to IPFS
    await ipfs.connectToPreloadNodes(campaignData.preloadNodes);


    const campaignCid = await createFlipstarterCampaignSite(ipfs, clientDag, campaign);
    const carUrl = await createFlipstarterCampaignBlobUrl(ipfs, campaignCid);
    const hashString = campaignCid.toString();
    const successfulPreloadNodeIndexes = await ipfs.requestPreloading(hashString, campaignData.preloadNodes, 10000);
    const gatewayUrl = campaignData.defaultGatewayUrl || DEFAULT_GATEWAY_URL;
    
    const result = {
      hash: campaignCid.toString(),
      url: gatewayUrl.replace(/\/$/, '')+ "/ipfs/" + hashString,
      download: carUrl,
      successfulPreloadNodeIndexes,
    };

    await set("draft", undefined);
    await set(result.hash, { ...campaignData, ...campaign, ...result, id: result.hash }, campaignStore);
    
    return result;
    
  } catch (err) {
    console.log("Error publishing.", err);
    throw err;
  }
}