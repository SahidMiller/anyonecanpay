import { useQueryClient, useMutation } from 'react-query';
import { useWallet } from './useWallet.js';

import useBroadcastTransaction from "../hooks/useBroadcastTransaction.js";
import { contributionQueryKeys } from '../queries/contributions.js';

import useFundraiser from '../hooks/useFundraiser';
import { route } from 'preact-router';
import { useRefreshContributionQueries } from '../hooks/useContributionQueries';

export default function useRefundMutation() {
  const broadcastTransaction = useBroadcastTransaction();
  const wallet = useWallet();

  const refreshContributionQueries = useRefreshContributionQueries();

  const broadcastTransactionMutation = useMutation(async function refundUtxo({ utxo, refundAddress }) {
      try {
        
        const refundTx = await wallet.createRefundTransaction(utxo, refundAddress);
        const refundTxHex = refundTx.toHex();
  
        const refundTxHash = await broadcastTransaction.mutateAsync(refundTxHex);
        if (!refundTxHash) throw new Error("Invalid transaction hash returned: " + refundTxHash);
  
        console.log(`Notification tx hash: (${refundTxHash})`);
          
      } catch (err) {
        console.log("Error broadcasting refund transaction", err);
        throw err;
      }
    }, {
    onMutate: () => {
    },
    onError: () => {
    },
    onSettled: () => {

    },
    onSuccess: async () => {
      await refreshContributionQueries();
      setTimeout(() => route('/'), 2000);
    }
  });

  return broadcastTransactionMutation;
}