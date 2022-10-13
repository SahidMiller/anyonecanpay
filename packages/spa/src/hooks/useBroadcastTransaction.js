import { useMutation } from 'react-query';
import { blockchainQueryKeys } from '../queries/blockchain.js';

export default function useBroadcastTransaction(mutationOptions) {
  return useMutation(blockchainQueryKeys.broadcastTransaction(), { 
    retry: 2 
  });
}