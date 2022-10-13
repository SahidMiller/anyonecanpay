import { useWallet } from "./useWallet";
import { useQuery } from "react-query";
import { walletQueryKeys } from "../queries/wallet";

export default function useWalletUtxosQuery() {
  const { scriptHash } = useWallet();
  const walletUtxosQuery = useQuery(walletQueryKeys.utxos(scriptHash), {
    enabled: !!scriptHash,
    placeholderData: []
  });
  
  return walletUtxosQuery;
}