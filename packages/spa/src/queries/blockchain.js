import { getTransactionHistory, getTransaction, getUtxos, broadcastTransaction, getBlockHeader } from "@ipfs-flipstarter/utils/electrum";
import { parseAddressFromOutputScript } from "@ipfs-flipstarter/utils/helpers";

const blockchainQueryKeys = {
  all: () => ['blockchain'],
  transactionHistory: (scriptHash) => ['blockchain', 'tx_history', scriptHash],
  blockHeader: (height) => ['blockchain', 'block_header', height],
  transaction: (txHash) => ['blockchain', 'transaction', txHash],
  previousAddress: (txHash) => ['blockchain', 'previousAddress', txHash],
  utxos: (scriptHash) => ['blockchain', 'utxos', scriptHash],
  broadcastTransaction: (additionalKeys = []) => ['broadcastTransaction', ...additionalKeys]
}

function registerBlockchainQueries(queryClient, electrum) {
  queryClient.setQueryDefaults(blockchainQueryKeys.all(), {
    queryFn: ({ queryKey }) => {
      const [, scope, ...args] = queryKey;

      if (scope === 'tx_history') {
        const [recipientScripthash] = args;
        return getTransactionHistory(electrum, recipientScripthash);
      }

      if (scope === 'block_header') {
        const [height] = args;
        return getBlockHeader(electrum, height);
      }

      if (scope === 'transaction') {
        const [txHash] = args;
        return getTransaction(electrum, txHash);
      }

      if (scope === 'previousAddress') {
        const [txHash] = args;
        return getPreviousAddress(queryClient, txHash)
      }

      if (scope === 'utxos') {
        const [scriptHash] = args;
        return getUtxos(electrum, scriptHash);
      }
    },
    staleTime: Infinity,
    cacheTime: Infinity
  });

  // Define the "addTodo" mutation
  queryClient.setMutationDefaults(['broadcastTransaction'], {
    mutationFn: (txHex) => {
      return broadcastTransaction(electrum, txHex);
    },
    onError: (error, variables, context) => {
      
    },
    retry: 3,
  });
}

async function getPreviousAddress(queryClient, txHash) {
  const firstTransaction = await Promise.resolve(queryClient.fetchQuery(blockchainQueryKeys.transaction(txHash), {
    enabled: !!scriptHash,
    staleTime: 0,
  })).catch(() => {});

  return firstTransaction.ins.find((vin) => {
    return parseAddressFromOutputScript(vin.script);
  });
}

export { blockchainQueryKeys, registerBlockchainQueries }