import { useWallet } from "./useWallet";
import { useQuery, useQueryClient } from "react-query";
import { walletQueryKeys } from "../queries/wallet";

export default function useCheckoutStatusQuery(donationAmount, queryOptions = {}) {
  const wallet = useWallet();
  const queryClient = useQueryClient();

  const walletUtxosQuery = useQuery({
    queryKey: walletQueryKeys.checkoutStatus(wallet.scriptHash, donationAmount), 
    queryFn: async () => {
      const allUtxos = await queryClient.fetchQuery(walletQueryKeys.utxos(wallet.scriptHash), { 
        staleTime: 0 
      });
  
      return await wallet.getCheckoutStatus(donationAmount, allUtxos);
    },
    ...queryOptions,
    enabled: !!wallet.scriptHash && (typeof queryOptions.enabled === 'undefined' || queryOptions.enabled),
    placeholderData: { 
      ready: false,
      fee: 0, 
      availableBalance: 0,
      utxos: []
    },
  });
  
  return walletUtxosQuery;
}