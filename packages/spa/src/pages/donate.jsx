import styled from "styled-components"
import { useState, useEffect, useRef, useMemo } from "react";
import DonationAmount from "../components/inputs/donation-amount.jsx";
import FloatingLabel from "../components/inputs/floating-label.jsx";
import RadioButton from "../components/inputs/radio-button.jsx";
import PrimaryButton from "../components/inputs/primary-button.jsx";
import Navigation from "../components/campaign-navigation.jsx";
import leftArrowSvg from "../../public/img/chevron-left-solid.svg";
import CheckoutModal from "../modals/checkout-modal.jsx";
import ElectronModal from "../modals/electron-modal.jsx";

import { route } from "preact-router";
import { useFundraiser } from "../hooks/useFundraiser.js";
import { useContributionsQuery } from "../hooks/useContributionQueries.js";
import { useCallback } from "react";
import useWalletUtxosQuery from "../hooks/useWalletUtxosQuery.js"

import { MIN_SATOSHIS } from "../utils/bitcoinCashUtilities.js";
import { DEV_TIPS_ADDRESS } from "../utils/constants.js";

import prettyPrintSats from "../utils/prettyPrintSats.js";
import moment from "moment"

import { feesFor } from "@ipfs-flipstarter/utils/helpers";
const maxOpReturnBytes = 220;
const notificationFee = feesFor(1, 1) + maxOpReturnBytes + MIN_SATOSHIS;

const Grid = styled.div.attrs()`
    display: grid;
    grid-gap: 1rem;
    grid-template-areas:
        "main"
        "sidebar";
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    padding-bottom: 1rem;
    padding-top: 1rem;
    
    @media screen and (min-width: 1024px) {
      grid-gap: 1.5rem 2rem;
      grid-template-areas: ". main main sidebar .";
      grid-template-columns: 1fr 4fr 4fr 4fr 1fr;
      grid-template-rows: auto;
      padding-bottom: 2rem;
      padding-top: 2rem;
    }
}`

const MainGridItem = styled.div`grid-area: main;`
const SidebarGridItem = styled.div`grid-area: sidebar;`
const todaysDate = new Date();
const oneMonthFromNow = new Date();
oneMonthFromNow.setMonth(todaysDate.getMonth() + 1);


function getDonationAmountError(donationAmount, max) {
  if (donationAmount > max) {
    const [text, denomination] = prettyPrintSats(max);
    return { error: `This donation exceeds what the campaign needs (${text} ${denomination})` }
  } else if (!donationAmount || isNaN(donationAmount)) {
    return { error: "Please enter a donation amount" }
  } else if (donationAmount < MIN_SATOSHIS) {
    return { error: "Minimum donation amount is 546 SATS" }
  } else {
    return { valid: true }
  }
}

const today = new Date();
const todayFormatted = today.toISOString().split("T")[0];

function GridSeparator({ padding = 6 }) {
  return <div class={`h-0 w-full border-t border-t-1 border-gray-300 my-${padding}`}></div>
}

export default function DonationPage({ defaultCurrency = "BCH", defaultDonationAmount }) {
  defaultDonationAmount = defaultDonationAmount ? Number(defaultDonationAmount) : 0;

  const campaign = useFundraiser();

  //So from now on, wait on the current contribution raised query and refetch regularly.
  const contributionsQuery = useContributionsQuery(campaign?.recipients);
  const { totalRaised:currentContributionAmount = 0, fullfillmentFees = 0 } = contributionsQuery.data || {};
  
  const campaignRequestingAmount = campaign.recipients.reduce((sum, recipient) => sum + recipient.satoshis, 0);

  const campaignBalance = campaignRequestingAmount > currentContributionAmount ? campaignRequestingAmount - currentContributionAmount : 0;
  const organizer = campaign.recipients && campaign.recipients.length ? campaign.recipients[0] : {};
  
  const [donationAmount, setDonationAmount] = useState(defaultDonationAmount);
  const [donationAmountSettled, setDonationAmountSettled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [disableCheckoutButton, setDisableCheckoutButton] = useState(true);
  const [hideCheckoutModal, setHideCheckoutModal] = useState(true);
  const [hideElectronModal, setHideElectronModal] = useState(true);

  const [alias, setAlias] = useState(false);
  const [comment, setComment] = useState(false);
  const [refundDate, setRefundDate] = useState(oneMonthFromNow);
  const refundTimestamp = refundDate && Math.floor(refundDate.getTime() / 1000);

  const campaignExpirationDate = campaign?.expires && new Date(campaign.expires * 1000);
  const validCampaignExpiration = campaignExpirationDate && campaignExpirationDate.getTime() > todaysDate.getTime();

  const totalAmount = donationAmount;
  const [donationAmountText, donationAmountDenomination] = prettyPrintSats(donationAmount);
  const [totalAmountText, totalAmountDenomination] = prettyPrintSats(totalAmount);

  const { data:utxos } = useWalletUtxosQuery();
  const balance = utxos.filter(utxo => !utxo.isLocked).reduce((s, u) => s + u.satoshis, 0);
  const fees = feesFor(utxos.length, 2) + notificationFee;
  const walletBalance = balance && balance - fees;

  const onDonationAmountChange = useCallback((donationAmount) => {
    setDonationAmount(donationAmount);
  }, [donationAmount]);


  const onContinue = useCallback(() => {
    setDonationAmountSettled(true);
    route(`/donate/${donationAmount}`)
  }, [donationAmount]);

  const onPaymentTypeChanged =  useCallback((e) => {
    setPaymentMethod(e.target.value);
    setDisableCheckoutButton(false);
  }, [])

  const onDonateNow =  useCallback((e) => {
    if (paymentMethod === "wallet") setHideCheckoutModal(false);
    if (paymentMethod === "electroncash") {
      setComment("");
      setAlias("");
      setRefundDate(oneMonthFromNow);
      setHideElectronModal(false);
    }
    
    route(`/donate/${donationAmount}`)
  }, [paymentMethod, donationAmount]);

  const goal = campaignRequestingAmount + fullfillmentFees;
  const [donationInputType, setDonationInputType] = useState("default");

  const [showDonationError, setShowDonationError] = useState(false);
  const [clickedOnce, setClickedOnce] = useState(false);

  const max = useMemo(() => {
    let max = 0;
    if (currentContributionAmount < goal) {
      const remainingAmount = goal - currentContributionAmount;
      max = remainingAmount < MIN_SATOSHIS ? MIN_SATOSHIS : remainingAmount
    }

    return max;
  }, [currentContributionAmount, goal]);

  const donationAmountError = useMemo(() => {
      const { error } = getDonationAmountError(donationAmount, max);
      return error;
  }, [donationAmount, max]);
  
  const onDonationAmountBlur = useCallback(() => {
    setShowDonationError(true)
  }, []);

  const onDonationAmountChanged = useCallback((value) => {
    const val = Number(value);

    if (donationInputType === "slider" && (val < 0 || val > MIN_SATOSHIS)) {
      setShowDonationError(true);
    }
    const donationAmount = isNaN(val) ? 0 : val;
    setDonationAmount(donationAmount);
    onDonationAmountChange && onDonationAmountChange(donationAmount)
  }, [donationInputType, onDonationAmountChange])

  const onContinueButtonClick = useCallback((e) => {
    //Let's continue if they already see the error
    if (clickedOnce || getDonationAmountError(donationAmount, max).valid) {
      setDonationAmountSettled(true);
      onContinue && onContinue()
    }

    setShowDonationError(true);
    setClickedOnce(true);
  }, [clickedOnce, donationAmount, max, onContinue]);

  const onDonationInputTypeToggle = useCallback(() => {
    setDonationInputType((donationInputType) => donationInputType === "default" ? "slider" : "default");
  }, []);

  const [isRefundDirty, setRefundDirty] = useState(false);
  const electronRefundRef = useRef();
  const walletRefundRef = useRef();

  const _onRefundDateChanged = useCallback((e) => {
    setRefundDirty(!!e.target?.value);
    setRefundDate(moment(e.target.value).endOf('day').toDate())
  }, []);

  useEffect(() => {
    const refundRef = paymentMethod === "wallet" ? walletRefundRef : paymentMethod === "electroncash" ? electronRefundRef : null;
    setRefundDirty(!!refundRef?.current?.value);
  }, [walletRefundRef.current, electronRefundRef.current, paymentMethod])

  const onFormClick = useCallback((e) => e.target.focus(), []);

  return <>
    <Grid className="mt-[65px] donate-page px-3 sm:px-4 lg:py-8 lg:px-16" onClick={onFormClick}>
      <MainGridItem className="donate-main">
        <div>
          <button class="hidden lg:block border border-gray-300 rounded px-4 py-1 text-gray-800" onClick={() => route("/")}>
            <div class="flex">
              <div class="text-lg h-4 w-4 p-1 mr-2"><img src={leftArrowSvg}></img></div>
              <div class="font-bold">Return to campaign</div>
            </div>
          </button>

          <div class="flex flex-row gap-4 my-6 lg:my-8">
            <div>
              <div class="bg-gray-200 relative w-40" style="padding-top:59%;">
                <div class="absolute bg-center bg-cover bg-no-repeat inset-0" style={campaign?.image ? `background-image: url(${campaign.image})` : ''}></div>
              </div>
            </div>
            <div class="mb-4">
              <div>You're supporting <b>{campaign.title}</b></div>
              <div class="text-gray-500 mt-1">Your donation will benefit <b>{organizer.name}</b></div>
            </div>
          </div>

          <form onSubmit={e => { e.preventDefault(); }}>
            <fieldset class="mb-6">
                <div class="mb-6">
                  <div class="mb-4">
                    <label class="font-bold text-gray-800" for="donationAmount">Enter your donation</label>
                    <a onClick={onDonationInputTypeToggle} class="text-blue-500 cursor-pointer underline text-xs pl-2">{donationInputType === "default" ? "with a slider." : "back to default." }</a>
                  </div>
                  <DonationAmount
                    defaultDonationAmount={defaultDonationAmount}
                    onDonationAmountChanged={onDonationAmountChanged} 
                    onBlur={onDonationAmountBlur}
                    current={currentContributionAmount}
                    goal={campaignRequestingAmount + fullfillmentFees}
                    donationInputType={donationInputType}
                    donationAmountError={showDonationError && donationAmountError}
                    walletBalance={walletBalance}
                  ></DonationAmount>
                </div>
                <div class="mb-6">
                  <legend class="font-bold text-gray-800">Tip Interplanetary services</legend>
                  <div class="mt-4">
                    <span class="text-gray-400">
                      Interplanetary Flipstarters is a decentralized platform with 0% fees and relies on the generosity of donors like you to operate this service. <br/> <b>Here's our</b> <a class="text-blue-500 cursor-pointer underline" href={DEV_TIPS_ADDRESS || "bitcoincash:qpclad9r4zah39du3n55xj3mwdrkeuh0nyx8dqfqut"}>address</a>
                    </span>
                  </div>
                </div>

                { !donationAmountSettled && <PrimaryButton onClick={onContinueButtonClick}>Continue</PrimaryButton> }
              </fieldset>
              
            { donationAmountSettled && <div class="mb-6">
              <legend class="font-bold text-gray-800">Payment method</legend>
              <div class="mt-4">
                <ul class="border rounded list-none text-xl tracking-wide">
                  <li class="border-b border-b-1 p-4">
                    <div class="flex items-center px-4 py-3">
                      <RadioButton  name="paymentMethod" id="wallet" value="wallet" checked={paymentMethod==="wallet"} onChange={onPaymentTypeChanged}></RadioButton>
                      <label class="pl-4 w-full cursor-pointer" for="wallet">
                        <div></div>
                        <span>Integrated wallet</span>
                      </label>
                    </div>
                    {
                      paymentMethod==="wallet" && <fieldset className="flex flex-col gap-2 py-3">
                        <div class="group group-hover:bg-gray-300 flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
                          <input class="w-full peer text-black outline-0" id="alias" type="text" name="alias" placeholder="&nbsp;" onChange={(e) => setAlias(e.target.value)}></input>
                          <FloatingLabel for="alias" className="absolute top-1 left-4 translate-y-3 bg-transparent">Alias</FloatingLabel>
                        </div>
                        <div class="group group-hover:bg-gray-300 flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
                          <input class="w-full peer text-black outline-0" id="comment" type="text" name="comment" placeholder="&nbsp;" onChange={(e) => setComment(e.target.value)}></input>
                          <FloatingLabel for="comment" className="absolute top-1 left-4 translate-y-3 bg-transparent">Comment</FloatingLabel>
                        </div>
                        { !validCampaignExpiration && <div class="group group-hover:bg-gray-300 flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
                          <input ref={walletRefundRef} min={todayFormatted} className={`${isRefundDirty ? "text-black" : "text-gray-500"} w-full peer outline-0`} id="refundDate" type="date" name="refundDate" onChange={_onRefundDateChanged}></input>
                          <FloatingLabel for="refundDate" className={`text-black absolute top-1 left-4 translate-y-3 bg-transparent`}>Auto-refund Date</FloatingLabel>
                        </div> }
                      </fieldset>
                    }
                  </li>
                  <li class="border-b border-b-1 p-4">
                    <div class="flex items-center px-4 py-3">
                      <RadioButton  name="paymentMethod" id="electroncash" value="electroncash" checked={paymentMethod==="electroncash"} onChange={onPaymentTypeChanged}></RadioButton>
                      <label class="pl-4 w-full cursor-pointer" for="electroncash">
                        <div></div>
                        <span>Electron Cash</span>
                      </label>
                    </div>
                    {
                      paymentMethod==="electroncash" && !validCampaignExpiration && <fieldset className="flex flex-col gap-2 py-3">
                        <div class="group group-hover:bg-gray-300 flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
                          <input ref={electronRefundRef} min={todayFormatted}  className={`${isRefundDirty ? "text-black" : "text-gray-500"} w-full peer outline-0`} id="refundDate" type="date" name="refundDate" onChange={_onRefundDateChanged}></input>
                          <FloatingLabel for="refundDate" className={`text-black absolute top-1 left-4 translate-y-3 bg-transparent`}>Auto-refund Date</FloatingLabel>
                        </div>
                      </fieldset>
                    }
                  </li>
                </ul>
              </div>
            </div>}
          </form>

          { donationAmountSettled && <PrimaryButton disabled={disableCheckoutButton} onClick={onDonateNow}>Donate now</PrimaryButton> }
          { !hideCheckoutModal && <CheckoutModal isFullfillment={donationAmount === max} donationAmount={donationAmount} recipients={campaign.recipients} alias={alias} comment={comment} refundTimestamp={campaign.expires || refundTimestamp} onHide={() => setHideCheckoutModal(true)}></CheckoutModal>}
          { !hideElectronModal && <ElectronModal donationAmount={donationAmount} recipients={campaign.recipients} expires={campaign.expires} onClose={() => setHideElectronModal(true)}></ElectronModal>}

        </div>
      </MainGridItem>
    </Grid>
  </>
}