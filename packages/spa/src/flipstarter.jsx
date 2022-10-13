import { ElectrumProvider } from "./providers/electrum-provider.jsx"
import { IpfsProvider } from "./providers/ipfs-provider.jsx"

import createIpfs from "./utils/createIpfs.js"
import createElectrum from "./utils/createElectrum.js"

import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
    
const localStoragePersistor = createSyncStoragePersister({storage: window.localStorage});

import { registerContributionQueries, contributionQueryKeys } from "./queries/contributions.js"
import { registerBlockchainQueries } from "./queries/blockchain.js"
import { registerIpfsQueries } from "./queries/ipfs.js"

import { useMemo, useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //Force queries to specify a cache time
      cacheTime: 0
    },
  },
});

/**@type {import('@tanstack/react-query-persist-client').PersistQueryClientOptions} */
const persistOptions = {
  queryClient,
  persister: localStoragePersistor,
  maxAge: Infinity,
  buster: 'v1',
}

export function IpfsFlipstarterProvider({ children, preloadNodes, defaultGatewayUrl, electrumServers }) {

  const { electrum, _createIpfs } = useMemo(() => {
    const electrum = window.electrum || createElectrum(electrumServers);
    const _createIpfs = window.ipfs ? Promise.resolve(window.ipfs) : createIpfs(preloadNodes);

    registerContributionQueries(queryClient, { createIpfs: _createIpfs, defaultGatewayUrl });
    registerBlockchainQueries(queryClient, electrum);
    
    window.electrum = electrum;
    window.queryClient = queryClient;
    window.contributionQueryKeys = contributionQueryKeys;
  
    return { _createIpfs, electrum }
  }, []);

  useEffect(async () => {
    const ipfs = await _createIpfs;
    
    registerIpfsQueries(queryClient, ipfs);
    
    window.ipfs = ipfs;

  }, [_createIpfs])

return <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
    <IpfsProvider createIpfs={_createIpfs}>
      <ElectrumProvider electrum={electrum}>
        { children }
      </ElectrumProvider>
    </IpfsProvider>
  </PersistQueryClientProvider>
}