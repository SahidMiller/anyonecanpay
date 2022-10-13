import prettyPrintSats from "../utils/prettyPrintSats.js";
import Modal from "./modal.jsx";
import PrimaryButton from "./primary-button.jsx"
import SecondaryButton from "./secondary-button.jsx"
import ContributionRow from "./contribution.jsx";
import CampaignContributionsView from "./campaign-contributions-view.jsx";

import { del } from "idb-keyval";
import campaignStore from "../utils/campaignStore.js";

import { Fragment, useState, useEffect, useMemo, useCallback, memo } from "react";

import { createFlipstarterFullfillmentTransaction, calculateFullfillmentFees } from "@ipfs-flipstarter/utils/common";

import { useQueryClient, useQuery } from 'react-query';

import { useContributionsQuery } from "../hooks/useContributionQueries.js";
import useBroadcastTransaction from "../hooks/useBroadcastTransaction.js";
import { contributionQueryKeys } from '../queries/contributions.js';

import { MIN_SATOSHIS } from "../utils/bitcoinCashUtilities.js";

import useFundraiser from "../hooks/useFundraiser";
import { useMutation } from "react-query";
import manageStore from "../utils/manageStore.js";

/**
 * 
 * @param {import('react-query').UseMutationOptions} mutationOptions
 * @returns {import('react-query').UseMutationResult}
 */
function useFullfillCampaign(mutationOptions) {
  const { recipients } = useFundraiser();
  const broadcastTransaction = useBroadcastTransaction();

  return useMutation(async (utxos) => {
    const fullfillmentTransaction = await createFlipstarterFullfillmentTransaction(recipients, utxos);
    const fullfillmentHash = await broadcastTransaction.mutateAsync(fullfillmentTransaction);
    return fullfillmentHash;
  }, mutationOptions);
}

function useCampaignBalance() {
  const { recipients = [] } = useFundraiser();
  const contributionsQuery = useContributionsQuery(recipients);

  const { 
    contributions:campaignContributions, 
    isFullfilled:campaignIsFullfilled, 
    totalRaised:committedSatoshis, 
    fullfillmentFees = 0 
  } = contributionsQuery.data || {};

  const requestedSatoshis = recipients.reduce((sum, recipient) => {
    return sum + recipient.satoshis;
  }, 0);

  return useQuery(['campaignBalance', campaignContributions], () => {
    let minimumNeeded = 0;
    const goal = requestedSatoshis + fullfillmentFees;
    if (!campaignIsFullfilled && committedSatoshis < goal) {
      const remainingAmount = goal - committedSatoshis;
      minimumNeeded = remainingAmount < MIN_SATOSHIS ? MIN_SATOSHIS : remainingAmount
    }

    return 0;
  })
}

const CampaignModal = memo(({ campaign, onClose }) => {
  const contributionsQuery = useContributionsQuery(campaign?.recipients);
  const { contributions:campaignContributions, isFullfilled:campaignIsFullfilled, totalRaised:committedSatoshis, fullfillmentFees } = contributionsQuery.data || {};
  const [pickedContributions, setPickedContributions] = useState([]);
  const [pickedContributionsDirty, setPickedContributionsDirty] = useState(false);
  const queryClient = useQueryClient();

  const fullfillCampaign = useFullfillCampaign({
    onSuccess: async (fullfillmentHash) => {
      console.log(fullfillmentHash);
      await queryClient.invalidateQueries(contributionQueryKeys.getContributions(campaign.recipients));
      setIsFullfilling(false);
      setFullfillmentSuccess(true);
    },
    onError: (err) => {
      console.log(err);
      showFullfillmentError("Unknown error occured.");
    },
    onSettled: () => {
      setIsFullfilling(false);
    },
  });

  const pickedSatoshis = (pickedContributions || []).reduce((sum, contribution) => {
    return sum + contribution.satoshis;
  }, 0);

  const requestedSatoshis = (campaign?.recipients || []).reduce((sum, recipient) => {
    return sum + recipient.satoshis;
  }, 0);

  const { minimumNeeded, minerFee, ready } = useCampaignBalance(); 
  const [requestedAmountText, requestedAmountDenomination] = prettyPrintSats(requestedSatoshis);
  const [committedAmountText, committedAmountDenomination] = prettyPrintSats(committedSatoshis);
  const [neededAmountText, neededAmountDenomination] = prettyPrintSats(minimumNeeded);
  const [feeAmountText, feeAmountDenomination] = prettyPrintSats(minerFee);
  
  const [isFullfilling, setIsFullfilling] = useState(false);
  const [fullfillmentSuccess, setFullfillmentSuccess] = useState(false);
  const [fullfillmentError, showFullfillmentError] = useState(null);

  const showFullfillment = !campaignIsFullfilled && minimumNeeded === 0;

  useEffect(() => {
    if (pickedContributionsDirty) return;
    if (!campaignContributions?.length) return;

    let total = 0;
    const pickedContributions = [];

    for (let i = 0; i < campaignContributions.length; i++) {
      
      const minerFee = calculateFullfillmentFees(
        pickedContributions.length, 
        campaign?.recipients?.length || 0
      );

      if (total >= requestedSatoshis + minerFee) break;

      const contribution = campaignContributions[i];
      if (contribution.fullfillment) continue;
      
      total += contribution.satoshis;
      pickedContributions.push(contribution);
    }

    setPickedContributions(pickedContributions);
  }, [campaignContributions, requestedSatoshis, campaign?.recipients?.length || 0]);

  function doPickContribution(contribution) {

    let updated = pickedContributions.indexOf(contribution) !== -1 ?
      //Remove
      pickedContributions.filter(c => c !== contribution) :
      //Add
      [...pickedContributions, contribution];

    setPickedContributionsDirty(true);
    setPickedContributions(updated);
  }

  async function startFullfillment() {  
    if (pickedSatoshis > requestedSatoshis) {
      setIsFullfilling(true);
      showFullfillmentError(null);
      
      fullfillCampaign.mutate();
    } else {
      showFullfillmentError("The total is less than the fundraiser goal!");
    }
  }

  const [showDelete, setShowDelete] = useState(false);
  function onStartDelete() {
    setShowDelete(true);
  }

  function onQuitDelete() {
    setShowDelete(false)
  }

  async function onDelete() {
    await del(campaign.parent, manageStore);
    onClose(true);
  }

  useEffect(() => {
    if (fullfillmentSuccess) {
      const timeout = setTimeout(() => {
        setFullfillmentSuccess(false);
      }, 2000)

      return () => clearTimeout(timeout);
    }
  }, [fullfillmentSuccess])

  const [page, setPage] = useState("contributions");

  const pages = {
    contributions: {
      Component: CampaignContributionsView,
      props: { 
        contributions: campaignContributions,
        showSelect: showFullfillment,
        pickedContributions: pickedContributions,
        onPickedContributions: doPickContribution
      },
      heading: <>Contributions to <span class="font-medium pr-1">{campaign.title}</span> fundraiser</>,
      footer: <div class="flex justify-between gap-4 flex-wrap">
        { showFullfillment ? <PrimaryButton disabled={pickedSatoshis < requestedSatoshis + minerFee} onClick={startFullfillment}>{ isFullfilling ? "Fullfilling..." : fullfillmentSuccess ? "Done!" : "Start fullfillment" }</PrimaryButton> : <></>}
        <SecondaryButton onClick={onClose}>Done</SecondaryButton>
        <SecondaryButton className="!text-red-700 xs:ml-auto" onClick={() => setPage("delete")}>Delete</SecondaryButton>          
      </div>
    },
    delete: {
      Component: Fragment,
      props: {},
      heading: <div class="font-normal">Are you sure you'd like to delete the <span class="font-bold pr-1">{campaign.title}</span> fundraiser?</div>,
      footer: <div class="flex justify-end gap-4">
        <SecondaryButton className="!text-red-700" onClick={onDelete}>Delete</SecondaryButton>
        <SecondaryButton onClick={() => setPage("contributions")}>Back</SecondaryButton>
      </div>
    }
  }
  
  const showView = pages[page];

  return <Modal heading={showView.heading} footer={showView.footer}>
    <showView.Component {...showView.props} />
  </Modal>
});

export default CampaignModal;
