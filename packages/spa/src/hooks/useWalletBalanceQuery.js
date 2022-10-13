import { useWallet } from "./useWallet";
import { useQuery } from "react-query";
import { walletQueryKeys } from "../queries/wallet";

export default function useWalletBalance(queryOptions = {}) {
  const { scriptHash } = useWallet();
  const walletBalanceQuery = useQuery(walletQueryKeys.balance(scriptHash), {
    staleTime: 0,
    ...queryOptions,
    enabled: !!scriptHash && (typeof queryOptions.enabled === 'undefined' || queryOptions.enabled),
  });
  
  return walletBalanceQuery;
}