import * as IPFS from 'ipfs';
import websocketMaFilters from "libp2p-websockets/src/filters.js";
import { getIpfs, providers } from "ipfs-provider";

const { httpClient, jsIpfs } = providers;
const jsIpfsProvider = jsIpfs({
  loadJsIpfsModule: () => IPFS,
  options: process.env.NODE_ENV === "development" ? {
    libp2p: {
      config: {
        transport: {
          WebSockets: {
            filter: websocketMaFilters.all,
          },
        }
      }
    },
  } : {}
});

export default async function createIpfs(preloadNodes = []) {
  
  const providers = process.env.NODE_ENV === 'development' ? 
    [jsIpfsProvider] :
    [
      //Local desktop ipfs client
      // httpClient({ apiAddress: '/ip4/127.0.0.1/tcp/5001' }),
      //Local desktop ipfs client
      // httpClient(),
      jsIpfsProvider
    ]
    
    /**@type {{ ipfs: import('ipfs').IPFS}} */
  const { ipfs, provider, apiAddress } = await getIpfs({
    loadHttpClientModule: async () => import("ipfs-http-client"),
    providers,
    options: {
      offline: true,
      silent: true,
      repoAutoMigrate: false,
      init: { allowNew: true },
      start: false,
    }
  });

  
  ipfs.connectToPreloadNodes = (...args) => connectToPreloadNodes(ipfs, ...args);
  ipfs.requestPreloading = requestPreloading
  
  const readyPromise = ipfs.start();
  
  ipfs.ready = (signal) => {
    return new Promise((res, rej) => {
      const cleanup = () => {
        signal.removeEventListener("abort", cleanup);
        rej();
      };

      signal?.addEventListener?.("abort", cleanup);

      readyPromise.then(async () => {  
        try {
          await ipfs.connectToPreloadNodes(preloadNodes, { signal })
        } catch (err) {
          console.log("Failed connecting to preload nodes", err);
        } finally {
          signal?.removeEventListener?.("abort", cleanup);
          res(ipfs);
        }
      });

    });
  }

  return ipfs;
}

async function connectToPreloadNodes(ipfs, preloadNodes = [], { 
  timeout = 5000,
  signal
}) {

  await Promise.all(preloadNodes.map(async (preloadNode, i) => {
    try {
      
      if (preloadNode.multiaddr) {
        const multiaddr = preloadNode.multiaddr.trim();
        
        await ipfs.swarm.disconnect(multiaddr, {
          timeout,
          signal
        }).catch((err) => {
          console.log(err)
        });
        
        await ipfs.swarm.connect(multiaddr, {
          timeout,
          signal
        }).catch((err) => {
          console.log(err)
        });
      }
    } catch (e) {}
  }));
}

async function fetchWithTimeout(url, timeout = 5000, signal) {
  let id;
  
  if (timeout && !signal) {
    const controller = new AbortController();
    signal = controller.signal;
    if (timeout) id = setTimeout(() => controller.abort(), timeout);
  }

  const result = await fetch(url, { method: "POST", signal, mode: 'cors' });
  if (timeout) clearTimeout(id);
  return result;
}

async function requestPreloading(hashString, preloadNodes = [], { timeout, signal } = {}) {

  const successfulPreloadNodeIndexes = [];

  try { 

    await Promise.all(preloadNodes.map(async (preloadNode, i) => {
      try {
        await fetchWithTimeout(preloadNode.url + "/api/v0/refs?r=true&arg=" + hashString, timeout, signal)
        successfulPreloadNodeIndexes.push(i);
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.log(e);
        }
      }
    }));

  } finally {

    return successfulPreloadNodeIndexes;
  }
}

async function decorateIpfsForBchBlockchain(ipfs) {
  let sha256Hasher = await ipfs.hashers.getHasher("sha2-256");
  let dblSha256Hasher = {
    code: 56,
    name: "dbl-sha2-256",
    digest: async (e) => {
      const digest1 = await sha256Hasher.digest(e);
      const digest2 = await sha256Hasher.digest(digest1.digest);
      return { 
        code: 56, 
        digest: digest2.digest, 
        size: 32, 
        bytes: Buffer.from([0x56, 32, ...digest2.digest]) 
      }
    }
  }

  ipfs.hashers.addHasher(dblSha256Hasher);
  
  //Get raw tx from IPFS
  ipfs.cidFromTxId = (txId) => {
    const rawCodec = 0x55;
    const dblSha2Codec = 0x56;
    const hashLength = 32;
    const txIdBuffer = Buffer.from(txId, "hex");
    const bytes = Buffer.from([dblSha2Codec, hashLength, ...txIdBuffer]);
    return IPFS.CID.createV1(rawCodec, { bytes: bytes });
  }

  ipfs.cidFromTxHash = (hash) => cidFromTxId(Buffer.from(hash, "hex").reverse());

  return ipfs;
}