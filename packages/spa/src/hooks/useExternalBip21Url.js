import { useState, useRef, useEffect } from "react";
import { useMutation } from "react-query";
import { useFundraiser } from "../hooks/useFundraiser.js";

import { walletQueryKeys } from "../queries/wallet.js"
import { createOpReturnTransaction } from "@ipfs-flipstarter/utils/external-wallet";

export default function useExternalBip21Url(electronCommitment, comment, alias, dataSignature) {
  const { recipients = [] } = useFundraiser();

  const addToIpfs = useMutation(walletQueryKeys.addIpfs());
  
  const createExternalBip21 = useMutation(async () => {

    const cid = await addToIpfs.mutateAsync({
      electronCommitment,
      applicationData: {
        comment,
        alias,
      },
      applicationDataSignature: dataSignature
    });

    const opReturnRaw = createOpReturnTransaction({ ...electronCommitment, cid }, recipients);
    return recipients[0].address + "?amount=.00000546&op_return_raw=" + opReturnRaw;
  });

  return createExternalBip21;
}