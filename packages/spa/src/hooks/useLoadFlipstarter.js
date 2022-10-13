import { useState, useEffect, useRef, useCallback } from "react"
import { SATS_PER_BCH } from "../utils/bitcoinCashUtilities";
import campaignStore from "../utils/campaignStore";
import manageStore from "../utils/manageStore.js";
import moment from "moment";

import {route} from "preact-router"
import { get, set, update, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';// Hook

const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState("idle");
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);
  // The execute function wraps asyncFunction and
  // handles setting state for pending, value, and error.
  // useCallback ensures the below useEffect is not called
  // on every render, but only if asyncFunction changes.
  const execute = useCallback(() => {
    setStatus("pending");
    setValue(null);
    setError(null);
    return asyncFunction()
      .then((response) => {
        setValue(response);
        setStatus("success");
      })
      .catch((error) => {
        setError(error);
        setStatus("error");
      });
  }, [asyncFunction]);
  // Call execute if we want to fire it right away.
  // Otherwise execute can be called later, such as
  // in an onClick handler.
  useEffect(() => {
    if (immediate && status === "idle") {
      execute();
    }
  }, [execute, immediate, status]);
  return { execute, status, value, error };
};

async function getAllCampaignData() {
  const campaignIds = await keys(manageStore);
  const campaigns = await Promise.all(campaignIds.map(async (id) => {
    return await getCampaignData(id)
  }));

  return campaigns.filter(Boolean);
}

export async function getCampaignData(id) {
  
  if (id === 'draft') {
    return await get("draft");
  } else {

    try {

      const campaignInfo = await get(id, manageStore);
      const sortedCampaignVersions = campaignInfo.versions.sort((a, b) => {
        return b.created - a.created;
      });
      
      const latestCampaignId = sortedCampaignVersions[0].id;
      
      const campaignData = await get(latestCampaignId, campaignStore);
      
      campaignData.parent = campaignInfo.id;

      const recipients = campaignData.recipients.map(recipient => {
        const bch = (recipient.satoshis / SATS_PER_BCH).toFixed(8);
        return { ...recipient, bch }
      });
      const expires = campaignData.expires && new Date(campaignData.expires * 1000).toISOString().split('T')[0];
      
      return { ...campaignData, expires, recipients, history: sortedCampaignVersions }

    } catch (err) {
    
      let campaignData = await get(id, campaignStore);

      //Convert v0/beta schema
      if (campaignData.campaign && campaignData.config) {
        const { campaign, config } = campaignData;
        const { baseClientCid, defaultGatewayUrl, preloadNodes } = config;
        const { descriptions, expires, recipients, title } = campaign;

        campaignData = { 
          clientConfig: {
            //No IPNS records in v0
            cid: baseClientCid,
          },
          defaultGatewayUrl,
          descriptions,
          expires: expires,
          hash: id,
          id,
          image: "",
          preloadNodes,
          recipients,
          successfulPreloadNodeIndexes: [],
          title,
          url: defaultGatewayUrl + "/ipfs/" + id
        }  
      }

      const recipients = campaignData.recipients.map(recipient => {
        const bch = (recipient.satoshis / SATS_PER_BCH).toFixed(8);
        return { ...recipient, bch }
      });
      const expires = campaignData.expires && new Date(campaignData.expires * 1000).toISOString().split('T')[0];
      
      return { ...campaignData, expires, recipients }
    }
  }
}

export async function saveCampaignResult(result) {  
  
  if (!result.parent) {

    if (process.env.NODE_ENV !== 'development') {
      await set("draft", undefined);
    }

    const randomId = uuidv4();
    const dbEntry = { 
      id: randomId,
      versions: [{
        id: result.id,
        created: moment().unix()
      }]
    }
    
    try {
      
      await set(randomId, dbEntry, manageStore);
      await set(result.id, result, campaignStore);

    } catch (err) {

      await del(randomId, manageStore);
      await set(result.id, campaignStore);

      throw err;
    }
    
    setTimeout(() => route("/manage/" + randomId), 400);

  } else {

    //Update parent with new result.
    await update(result.parent, ({ id, versions:previousVersions }) => {
      return { 
        id, 
        versions: [{ id: result.id, created: moment().unix() }, ...previousVersions]
      }
    }, manageStore);

    //Add current to the campaign store.
    await set(result.id, result, campaignStore);

    return await getCampaignData(result.parent);
  }
}

/**
 * 
 * @param {string} id form id
 * @param {import('react-query').UseQueryOptions} queryOptions passed to useQuery
 * @return {import('react-query').UseQueryResult}
 */
export async function useLoadFlipstarter(id, callbacks) {
  const callbackRefs = useRef();
  callbackRefs.current = callbacks;

  useEffect(async () => {
    const { onFetch, onSuccess, onError, onSettled } = callbackRefs.current;

    try {
      await onFetch();
      const campaignData = await getCampaignData(id);
      await onSuccess(campaignData);
    } catch (err) {
      await onError(err);
    } finally {
      await onSettled();
    }
  }, [id]);
}

/**
 * 
 * @param {string} id form id
 * @param {import('react-query').UseQueryOptions} queryOptions passed to useQuery
 * @return {import('react-query').UseQueryResult}
 */
 export function useLoadFlipstarters(callbacks) {
  const callbackRefs = useRef();
  callbackRefs.current = callbacks;

  const asyncFunc = useCallback(async () => {
    const { onFetch, onSuccess, onError, onSettled } = callbackRefs.current || {};

    try {
      await onFetch?.();
      const campaignData = await getAllCampaignData();
      await onSuccess?.(campaignData);
      return campaignData;
    } catch (err) {
      await onError?.(err);
    } finally {
      await onSettled?.();
    }
  }, []);

  return useAsync(asyncFunc, true);
}