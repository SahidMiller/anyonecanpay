import { useQueryClient, useMutation } from 'react-query'

import { freezeUtxo, unfreezeUtxo } from "../utils/frozen-coins.js"
import { useWallet } from "../hooks/useWallet.js";
import { walletQueryKeys } from '../queries/wallet.js';

export function useToggleUtxoLock() {
  const { scriptHash } = useWallet();
  const queryClient = useQueryClient();
  const queryId = walletQueryKeys.frozenUtxos();

  const toggleUtxoLock = useMutation(async (utxo) => {
    if (!utxo.isLocked) {
      return freezeUtxo(utxo.txHash, utxo.txIndex);
    } else {
      return unfreezeUtxo(utxo.txHash, utxo.txIndex);
    }
  }, {
    onMutate: async (utxo) => {
      await queryClient.invalidateQueries(queryId);
      await queryClient.invalidateQueries(walletQueryKeys.utxos(scriptHash));
      await queryClient.invalidateQueries(walletQueryKeys.balance(scriptHash));

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries(queryId);

      // Snapshot the previous value
      const previousFrozenUtxos = queryClient.getQueryData(queryId);

      queryClient.setQueryData(queryId, (frozenUtxos = []) => {
        const currentUtxoKey = utxo.txHash + ":" + utxo.txIndex;
        if (frozenUtxos.indexOf(currentUtxoKey) === -1) {
          return [...frozenUtxos, currentUtxoKey];
        }

        return frozenUtxos;
      });
      
      // Return a context object with the snapshotted value
      return { previousFrozenUtxos }
    },
    onError: (err, utxo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      return queryClient.setQueryData(queryId, context.previousFrozenUtxos);
    },
    onSettled: async () => {
      // Always refetch after error or success:
      await queryClient.invalidateQueries(queryId);
      await queryClient.invalidateQueries(walletQueryKeys.utxos(scriptHash));
      await queryClient.invalidateQueries(walletQueryKeys.balance(scriptHash));
    },
  });

  return toggleUtxoLock;
}

export default useToggleUtxoLock;