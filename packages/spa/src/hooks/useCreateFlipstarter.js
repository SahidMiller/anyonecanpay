import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useCallback } from "react"

import { create as createFlipstarterCampaignSite } from "@ipfs-flipstarter/utils/ipfs"
import { default as createFlipstarterCampaignBlobUrl } from "../utils/createFlipstarterCampaignBlobUrl.js";
import { SATS_PER_BCH } from "../utils/bitcoinCashUtilities";
import { useIpfs } from "../hooks/useIpfs.js";
import { decode as decodeDagPb } from "@ipld/dag-pb"
import { create as createIpfsHttpClient } from "ipfs-http-client";

import { ipfsQueryKeys } from "../queries/ipfs.js";

/**
 * @param {import('react-query').UseMutationOptions} mutationOptions 
 * @returns {import('react-query').UseMutationResult}
 */
 export function useCreateFlipstarter(mutationOptions) {
  const { ipfs } = useIpfs();
  const queryClient = useQueryClient();
  const abortControllerRef = useRef(null);

  const submitMutation = useMutation(async (campaignData) => {
    const signal = abortControllerRef.current.signal;
    const onCancelEvents = [];
    const onCancel = async () => {
      signal.removeEventListener("abort", onCancel);

      try {
        await Promise.all(onCancelEvents.map(fn => Promise.resolve(fn()).catch((err) => console.log(err))));
      } catch (err) { 
        console.log(err);
      }
    };

    signal.addEventListener("abort", onCancel);

    onCancelEvents.push(async () => queryClient.cancelQueries([ipfsQueryKeys.loadClientCidQuery()]));
    const cid = await queryClient.fetchQuery(ipfsQueryKeys.loadClientCidQuery(), {
      staleTime: 0
    });

    onCancelEvents.push(() => queryClient.cancelQueries([ipfsQueryKeys.loadClientManifestQuery(cid)]));
    const loadedClient = await queryClient.fetchQuery(ipfsQueryKeys.loadClientManifestQuery(cid))

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
        cid: loadedClient.cid,
        dag: loadedClient.dag,
        signature: loadedClient.signature,
        address: loadedClient.address
      }
    }

    if (campaignData.expires) {
      campaign.expires = Math.floor(new Date(campaignData.expires + "T23:59:59.999Z").getTime() / 1000)
    }

    //Connect to preload nodes before pushing to IPFS
    await ipfs.connectToPreloadNodes(campaignData.preloadNodes, { signal });
    const campaignCid = await createFlipstarterCampaignSite(ipfs, decodeDagPb(Buffer.from(loadedClient.dag, "hex")), campaign, { signal });
    
    try {
      
      await Promise.all(campaignData.preloadNodes.map(async ({ url }) => {
        try {
          const ipfsHttpApi = createIpfsHttpClient({ url });
          const data = { ...campaign, version: "0.0.1" };
          
          const { cid, size } = await ipfsHttpApi.add(JSON.stringify(data), { preload: false, signal });
          console.log(cid)
        } catch (err) {
          console.log(err);
        }
      }));

    } catch (err) {
      console.log(err);
    }

    const carUrl = await createFlipstarterCampaignBlobUrl(ipfs, campaignCid, { signal });
    const hashString = campaignCid.toString();
    const successfulPreloadNodeIndexes = (await ipfs.requestPreloading(hashString, campaignData.preloadNodes, {
      timeout: 10000, 
      signal
    })) || [];
    const gatewayUrl = campaignData.defaultGatewayUrl || DEFAULT_GATEWAY_URL;
    
    const result = {
      hash: campaignCid.toString(),
      url: gatewayUrl.replace(/\/$/, '')+ "/ipfs/" + hashString,
      download: carUrl,
      successfulPreloadNodeIndexes,
    };
    
    signal.removeEventListener("abort", onCancel);

    return { ...campaignData, ...campaign, ...result, id: result.hash };
  }, {
    ...mutationOptions
  });

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    submitMutation.reset()
  }, [submitMutation.reset]);

  const mutate = useCallback((campaignData) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController()
    submitMutation.mutate(campaignData);

  }, [submitMutation.reset]);

  return { 
    ...submitMutation,
    reset,
    mutate,
  }
}