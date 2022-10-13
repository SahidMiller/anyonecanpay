import { CID } from "multiformats/cid";
import { ipfsLoadClientSite } from "../utils/ipfsLoadClientSite.js";
import { FLIPSTARTER_CLIENT, PRELOAD_NODES } from "../utils/constants.js"
import all from "it-all";

const ipfsQueryKeys = {
  all: () => ['ipfs'],
  loadClientCidQuery: () => ['ipfs', 'loadClientCidQuery'],
  loadClientManifestQuery: (cid) => ['ipfs', 'loadClientManifestQuery', cid]
}

function registerIpfsQueries(queryClient, ipfs) {
  queryClient.setQueryDefaults(ipfsQueryKeys.all(), {
    queryFn: ({ queryKey, signal }) => {
      const [, scope, ...args] = queryKey;

      if (scope === 'loadClientCidQuery') {
        return loadClientCidQuery(ipfs, { signal })
      }

      if (scope === 'loadClientManifestQuery') {
        const [cid] = args;
        return loadClientManifestQuery(ipfs, cid, { signal })
      }
    }
  });
}

async function loadClientCidQuery(ipfs, { signal }) {

  //Get the latest client cid in order to fetch manifest and/or publish to independent IPFS nodes.      
  let clientCid

  try {
    //Fetch the latest client car and data (for uploading to independent IPFS nodes)
    clientCid = await ipfsLoadClientSite(ipfs, signal)
  } catch (err) {
    console.log("Unable to fetch base CID from gateway", err);
  }

  if (clientCid) {
    return clientCid.toV0().toString();
  }
}

async function loadClientManifestQuery(ipfs, cid, { signal }) {
  const { dag, signature, address } = JSON.parse(await all(ipfs.cat(cid + "/manifest.json", { 
    signal 
  })));

  return { cid, dag, signature, address };
}

export { ipfsQueryKeys, registerIpfsQueries }