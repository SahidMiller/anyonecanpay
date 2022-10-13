import { useMemo } from "react";
import { useQuery, useQueryClient } from "react-query";
import useFundraiser from "../hooks/useFundraiser";
import { blockchainQueryKeys } from "../queries/blockchain";
import { parseCommitmentFromElectronCash } from "@ipfs-flipstarter/utils/external-wallet"
import { contributionFromTransaction, validateContribution } from "@ipfs-flipstarter/utils/common"

import bitcoinCashLib from "@psf/bitcoincashjs-lib";
const {Transaction} = bitcoinCashLib;

/**
 * Validate an external commitment payload by checking it exists on the blockchain. 
 * 
 * Retries by default due to possible new utxo not propagated yet.
 * 
 * @param {string} userCommitment base64 encoded string from Electron Cash flipstarter plugin
 * @returns {UseQueryResult<{txHash:number}>} 
 */
export const useValidateExternalCommitmentQuery = (userCommitment) => {
  const { recipients = [] } = useFundraiser();
  const queryClient = useQueryClient();

  return useQuery(['verifyElectronCommitment', userCommitment], async () => {
    if (!userCommitment) return;

    const commitment = parseCommitmentFromElectronCash(userCommitment);
    const committedTransactionHex = await queryClient.fetchQuery(blockchainQueryKeys.transaction(commitment.txHash));
    const committedTransaction = Transaction.fromHex(committedTransactionHex);
    const commitmentData = contributionFromTransaction(committedTransaction, commitment.txIndex)
    const contribution = { ...commitment, ...commitmentData }

    if (validateContribution(contribution, recipients)) {
      return contribution;
    }
  }, {
    enabled: !!userCommitment,
    staleTime: 20000,
    cacheTime: 20000,
    retry: 5
  });
}
