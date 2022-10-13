import prettyPrintSats from "../utils/prettyPrintSats.js";
import { useContributionsQuery } from "../hooks/useContributionQueries.js";
import { Link } from "preact-router";

import { memo } from "react";

const CampaignCard = memo(({ campaign, onOpen, ...props }) => {
  const contributionsQuery = useContributionsQuery();
  const { contributions = [], isFullfilled = false, totalRaised:committedSatoshis = 0, fullfillmentFees = 0 } = contributionsQuery.data || {}

  const image = campaign.image || campaign?.recipients?.[0]?.image;

  const requestedSatoshis = (campaign?.recipients || []).reduce((sum, recipient) => {
    return sum + recipient.satoshis;
  }, 0);

  const [requestedAmountText, requestedAmountDenomination] = prettyPrintSats(requestedSatoshis);
  const [committedAmountText, committedAmountDenomination] = prettyPrintSats(committedSatoshis);
  const percentageCompleted = Math.round((committedSatoshis / requestedSatoshis) * 100);
  const readyToFullfill = requestedSatoshis + fullfillmentFees <= committedSatoshis;

  const pledgeCount = contributions.length;

  function onCardClick() {
    onOpen(campaign);
  }

  return <div { ...props } class="campaign-card cursor-pointer border rounded-3xl shadow-xl overflow-hidden" onClick={onCardClick}>
    <div>
      <div>
        <div>
          {/* Card Hero */}
          <div class="bg-gray-200 relative" style="padding-top:56%;">
            <div class="absolute w-full h-full inset-0 bg-cover bg-center" style={`background-image:url(${image})`}></div>
          </div>

          {/* Card Body */}
          <div class="p-4">
            <h4 class="pb-2 mb-2 border-b border-gray-400"><Link href={`/manage/${campaign.parent}`}>{campaign.title}</Link></h4>
            <div class="text-sm font-light">
              <div class="my-2">
                <div class="mb-1 bg-gray-200 flex h-4 overflow-hidden rounded-xl">
                  <div role="progressbar" class="bg-green-400" style={`width: ${percentageCompleted || 0}%;`}></div>
                </div>
                <small class="mx-1 flex flex-row flex-wrap gap-x-2"><span>{committedAmountText} {committedAmountDenomination} of {requestedAmountText} {requestedAmountDenomination}</span> <span>({percentageCompleted}% completed)</span></small>
              </div>
              <div class="flex justify-end xs:justify-between">
                <div class="hidden xs:block">
                  <p class="uppercase">{isFullfilled ? "Fullfilled" : readyToFullfill ? "Fullfill Now" : "Ongoing"}</p>
                </div>
                <div class="text-right">
                  <p>{pledgeCount} { pledgeCount === 1 ? "Pledge" : "Pledges" }</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
})

export default CampaignCard;