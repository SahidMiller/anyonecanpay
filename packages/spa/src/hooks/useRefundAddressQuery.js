import { useWallet } from "./useWallet";
import { useQuery } from "react-query";
import { walletQueryKeys } from "../queries/wallet";

export default function useRefundAddressQuery({ interval } = {}) {
  const { scriptHash } = useWallet();
  const useRefundAddressQuery = useQuery(walletQueryKeys.refundAddress(scriptHash), {
    enabled: !!scriptHash
  });
  
  return useRefundAddressQuery;
}