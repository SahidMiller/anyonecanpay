import { useMemo } from "react"
import { createExternalWalletPayload } from "@ipfs-flipstarter/utils/external-wallet";
import useFundraiser from "../hooks/useFundraiser.js";

export default function useExternalWalletPayload(donationAmount) {
  const { recipients = [], expires } = useFundraiser();

  return useMemo(() => {
    return createExternalWalletPayload(donationAmount, recipients, expires);
  }, [donationAmount, recipients, expires]);
}