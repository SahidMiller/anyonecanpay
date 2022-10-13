import { route } from "preact-router";
import { useMemo } from "react";
import { useMutation } from "react-query";
import { useWallet } from "../hooks/useWallet.js";
import useBroadcastTransaction from "../hooks/useBroadcastTransaction";
import useFundraiser from "../hooks/useFundraiser";
import { useRefreshContributionQueries } from "../hooks/useContributionQueries.js";

import { notificationFee } from "@ipfs-flipstarter/utils/web-wallet";
import { createFlipstarterFullfillmentTransaction, calculateFullfillmentFees } from "@ipfs-flipstarter/utils/common";

import { useToggleUtxoLock } from "./useToggleUtxoLock.js"

import { useQueryClient } from "react-query";
import { walletQueryKeys } from "../queries/wallet.js";
import { contributionQueryKeys } from "../queries/contributions.js";

import bitcoinCashLib from "@psf/bitcoincashjs-lib";
const {Transaction} = bitcoinCashLib;

function useAddIpfs() {
  return useMutation(['addIpfs'], { retry: 2 });
}

function useCreateNotificationTransaction() {
  const wallet = useWallet();
  const { recipients } = useFundraiser(); 
  
  return useMutation(async ({ commitmentData, commitmentCid, notificationOutpoint }) => {
    const notificationAddress = recipients?.[0]?.address;
    return wallet.createNotificationTransaction({ commitmentData, commitmentCid, notificationOutpoint, notificationAddress });
  });
}

function useCreateSetupTransaction(donationAmount) {
  const queryClient = useQueryClient();
  const wallet = useWallet();

  return useMutation(async () => {
    const allUtxos = await queryClient.fetchQuery(walletQueryKeys.utxos(wallet.scriptHash), { 
      staleTime: 0 
    });

    const { ready, utxos } = await wallet.getCheckoutStatus(donationAmount, allUtxos);
    if (!ready) throw new Error("Wallet is not ready to make a donation with this amount.");
    return wallet.createSetupTransaction(donationAmount, utxos);
  });
}

function useCreateSignedApplicationData({ comment, alias }, refundAddress, refundTimestamp) {
  const wallet = useWallet();
  const { recipients } = useFundraiser(); 

  return useMutation(async ({ commitmentOutpoint }) => {
    return wallet.createCommitmentApplicationData(
      recipients,
      commitmentOutpoint, 
      {comment, alias},
      refundAddress,
      refundTimestamp
    );
  });
}

export function useBroadcastPledge(donationAmount, comment, alias, refundAddress, refundTimestamp, isFullfillment) {
  const { recipients = [] } = useFundraiser();

  const createSetupTransaction = useCreateSetupTransaction(donationAmount);
  const createSignedApplicationData = useCreateSignedApplicationData({ comment, alias }, refundAddress, refundTimestamp);
  const createCommitmentHash = useAddIpfs();
  const createNotificationTransaction = useCreateNotificationTransaction();
  const broadcastSetupTransaction = useBroadcastTransaction();
  const broadcastNotificationTransaction = useBroadcastTransaction();
  const broadcastFullfillmentTransaction = useBroadcastTransaction();
  const toggleUtxoLock = useToggleUtxoLock();
  const refreshContributionQueries = useRefreshContributionQueries();
  const queryClient = useQueryClient();

  const createFullfillmentTransaction = useMutation(async (commitmentOutpoint) => {
    const contributionsQuery = await queryClient.fetchQuery(contributionQueryKeys.getContributions(recipients));
    const { contributions, isFullfilled, committedSatoshis, fullfillmentFees } = contributionsQuery || {};
    const fullfillmentTransactionRaw = await createFlipstarterFullfillmentTransaction(recipients, [...contributions, commitmentOutpoint]);
    return Transaction.fromHex(fullfillmentTransactionRaw);
  });

  const mutation = useMutation(async () => {
    const setupTransaction = await createSetupTransaction.mutateAsync();
    
    const commitmentOutpoint = { 
      txHash: setupTransaction.getId().toString(), 
      txIndex: 0, 
      satoshis: donationAmount,
      seqNum: 0xffffffff
    };
    
    const notificationOutpoint = { 
      txHash: setupTransaction.getId().toString(), 
      txIndex: 1, 
      satoshis: notificationFee,
      seqNum: 0xffffffff
    };

    const { commitmentData, applicationData, applicationDataSignature } = await createSignedApplicationData.mutateAsync({ commitmentOutpoint }, {
      onError: (err) => {
        console.log('error signing data', err);
      }
    });

    const commitmentCid = await createCommitmentHash.mutateAsync({ commitmentData, applicationData, applicationDataSignature, recipients });

    let fullfillmentTransaction;
    if (isFullfillment) {
      fullfillmentTransaction = await createFullfillmentTransaction.mutateAsync(commitmentData);
    }

    const notificationTransaction = await createNotificationTransaction.mutateAsync({
      commitmentData, 
      commitmentCid, 
      notificationOutpoint
    });

    await broadcastSetupTransaction.mutateAsync(setupTransaction.toHex());
    await broadcastNotificationTransaction.mutateAsync(notificationTransaction.toHex());
    try {
      fullfillmentTransaction && await broadcastFullfillmentTransaction.mutateAsync(fullfillmentTransaction.toHex());
    } catch (err) {
      console.log("failed to fullfill locally", err);
    }

    await toggleUtxoLock.mutateAsync({ 
      txHash: setupTransaction.getId().toString(), 
      txIndex: 0, 
      isLocked: false 
    });

    await refreshContributionQueries();

  }, {
    onSuccess: () => {
      setTimeout(() => route('/'), 2000);
    }
  });

  return useMemo(() => {
    let pledgeStatus = "idle";

    if (createSetupTransaction.isLoading) {
      pledgeStatus = "setup"
    } else if (createSignedApplicationData.isLoading) {
      pledgeStatus = "ipfs"
    } else if (createNotificationTransaction.isLoading) {
      pledgeStatus = "notification"
    }  else if (createFullfillmentTransaction.isLoading) {
      pledgeStatus = "fullfillment"
    } else if (broadcastSetupTransaction.isLoading) {
      pledgeStatus = "setup.broadcast"
    } else if (broadcastNotificationTransaction.isLoading) {
      pledgeStatus = "notification.broadcast"
    } else if (broadcastFullfillmentTransaction.isLoading) {
      pledgeStatus = "fullfillment.broadcast"
    } else if (toggleUtxoLock.isLoading) {
      pledgeStatus = "lock"
    } 
    
    return { ...mutation, pledgeStatus }
  }, [
    mutation, 
    createSetupTransaction, 
    createSignedApplicationData, 
    createNotificationTransaction, 
    broadcastSetupTransaction, 
    broadcastNotificationTransaction, 
    toggleUtxoLock
  ]);
}

export default useBroadcastPledge;
