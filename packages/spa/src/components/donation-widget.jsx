import styled from "styled-components"
import ProgressBar from "./progress-bar.jsx";

import prettyPrintSats from "../utils/prettyPrintSats.js";
import pluralize from "../utils/pluralize.js";

import { forwardRef, useMemo } from "react";
import moment from "moment";

const Separator = styled.span`
  &:before {
    content: "•";
    font-size: 15px;
    margin-right: 0.25rem;
  }
`
const DonationWidget = forwardRef(({ 
  fullfillmentTimestamp = null,
  requestedAmount = 0, 
  amountRaised = 0, 
  contributionCount = 0,
  expires,
  onPledge,
  onShare,
  className
}, ref) => {
  
  const [requestedAmountText, requestedDenominationText] = prettyPrintSats(requestedAmount);
  const [amountRaisedText, amountRaisedDenominationText] = prettyPrintSats(amountRaised);
  const notExpired = expires > moment().unix();
  const isFullfilled = !!fullfillmentTimestamp;

  const expiresInText = useMemo(() => {
    if (!expires && !isFullfilled) return "";

    return <>
      { !isFullfilled && notExpired ? "Ends" : "Ended" }
      <strong> { moment().to(moment.unix(fullfillmentTimestamp || expires)) }</strong>
    </>
  }, [expires, isFullfilled]);

  const expirationDate = expires && new Date(expires * 1000)
  return <div className={`donate-panel flex flex-col ${className}`} ref={ref}>
    <div class="my-4 sm:my-1">
      <ProgressBar goal={requestedAmount} total={amountRaised}></ProgressBar>
    </div>

    <div class="flex flex-wrap justify-between items-baseline gap-2 sm:order-first sm:mt-6 total-raised">
      <span class="col-span-5">
        <span class="mr-1"><b>{ amountRaisedText } {amountRaisedDenominationText }</b> <small>raised of { requestedAmountText } { requestedDenominationText === "SATS" ? "SAT" : requestedDenominationText } goal</small></span>
        <small class="sm:hidden"><strong class="px-2">•</strong><strong> { contributionCount }</strong> { pluralize({ singular: "contribution", count: contributionCount })}</small>
        { expiresInText ? <small class="sm:hidden"><strong class="px-2">•</strong>{expiresInText}</small> : <></> }
      </span>
    </div>

    <span className="hidden sm:block text-gray-500">
      <small><strong> { contributionCount }</strong> { pluralize({ singular: "contribution", count: contributionCount })}</small>
      { expiresInText ? <small><strong class="px-2">•</strong>{expiresInText}</small> : <></> }
    </span>


    { !!notExpired && !isFullfilled && <div class="flex flex-col gap-4 mt-4">
      <div>
        <button class="cta-btn secondary-btn gradient" onClick={onShare}><span>Share</span></button>
      </div>
      <div>
        <button class="cta-btn primary-btn gradient" onClick={onPledge}><span>Pledge now</span></button>
      </div>
    </div> }
  </div>
})

export default DonationWidget