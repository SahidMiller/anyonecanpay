import { useState, useEffect, useRef } from "react";
import useCopy from "../hooks/useCopy.js";

import { useWallet } from "../hooks/useWallet.js";
import useWalletBalanceQuery from "../hooks/useWalletBalanceQuery.js";
import useWalletUtxosQuery from "../hooks/useWalletUtxosQuery.js"
import useRefundAddressQuery from "../hooks/useRefundAddressQuery.js"
import useCheckoutStatusQuery from "../hooks/useCheckoutStatusQuery.js"
import useBroadcastPledge from "../hooks/useBroadcastPledge.js";

import FloatingLabel from "./inputs/floating-label.jsx";
import {QRCodeCanvas} from "qrcode.react";
import CompleteCheckmarkLoader from "./inputs/checkmark-completed.jsx";
import styled from "styled-components"

import prettyPrintSats from "../utils/prettyPrintSats.js";
import { SATS_PER_BCH } from "../utils/bitcoinCashUtilities.js";

const CheckoutGrid = styled.div`
  display: grid;
  grid-template-areas: 
    "qr"
    "copy"
    "open"
    "amount"
    "check";
  grid-row-gap: 1rem;
  grid-column-gap: 1rem;
  grid-template-columns: 1fr;
  grid-template-rows: auto;


  @media screen and (min-width: 640px) {
    grid-template-areas:
      "qr qr amount amount"
      "copy open check check";
    grid-template-columns: 25% 25% 25% 25%;
    grid-column-gap: 0rem;
    grid-row-gap: 0rem;
  }

`;

export default function Checkout({ donationAmount, alias, comment, refundTimestamp, setPrimaryButtonData, isFullfillment = false }) {
  donationAmount = Number(donationAmount);

  const { address } = useWallet();

  const [userRefundAddress, setUserRefundAddress] = useState();
  const [userRefundAddressDirty, setUserRefundAddressDirty] = useState(false);
  
  const { isFetching:isFetchingUtxos, data:utxos, refetch:fetchUtxos } = useWalletUtxosQuery();
  const { data:previousAddress } = useRefundAddressQuery();
  
  //Use previous address unless user changed the refundAddress
  const refundAddress = userRefundAddressDirty ? userRefundAddress : previousAddress;
  
  const pledgeMutation = useBroadcastPledge(donationAmount, comment, alias, refundAddress, refundTimestamp, isFullfillment);
  const madePledge = pledgeMutation.isSuccess;
  const makingPledge = pledgeMutation.isLoading;
  const statusText = getStatus(pledgeMutation);
  
  const { data:liveAvailableAmount } = useWalletBalanceQuery({
    //Don't change while making a request
    enabled: !makingPledge && !madePledge,
    staleTime: 2000
  });

  const { data:checkoutStatus } = useCheckoutStatusQuery(donationAmount, {
    enabled: !makingPledge && !madePledge
  });
  
  const { ready, fee:feesAmount, checkoutBalance:requestingAmount } = checkoutStatus;    
  
  const availableAmount = !makingPledge ? 
    liveAvailableAmount : 
    checkoutStatus.availableBalance;

  const [showError, setShowError] = useState(false);
  
  const bip21Request = `${address}?amount=${(requestingAmount) / SATS_PER_BCH}`;
  const [copyAddressToClipboard, showSuccessfulAddressCopy] = useCopy(bip21Request);

  const [donationAmountText, donationAmountDenomination] = prettyPrintSats(donationAmount);
  const [availableAmountText, availableAmountDenomination] = prettyPrintSats(availableAmount);
  const [requestingAmountText, requestingAmountDenomination] = prettyPrintSats(requestingAmount);
  const [feesAmountText] = prettyPrintSats(feesAmount);
  const [clickedPledged, setClickedPledged] = useState(false);

  useEffect(() => {
    setClickedPledged(false);
  }, [userRefundAddress])

  useEffect(() => {
    setPrimaryButtonData?.({
      onClick: async () => {
        if ((!previousAddress || !userRefundAddress || !userRefundAddressDirty) && !clickedPledged) {
          setClickedPledged(true);
        } else {
          setClickedPledged(false);
          await pledgeMutation.mutateAsync();
        }
      },
      text: madePledge ? "Done!" : makingPledge ? "Loading..." : isFullfillment ? "Fullfill" : "Pledge",
      disabled: !ready || makingPledge || madePledge
    });
  }, [
    setPrimaryButtonData, 
    pledgeMutation.mutateAsync, 
    (!previousAddress || !userRefundAddress || !userRefundAddressDirty) && !clickedPledged,
    madePledge, 
    makingPledge, 
    ready, 
    isFullfillment
  ]);

  function onCopyAddress(e) {
    copyAddressToClipboard();
  }

  function onCheckBalance(e) {
    fetchUtxos();
  }

  function onRefundAddressChanged(e) {
    setUserRefundAddressDirty(true);
    setUserRefundAddress(e.target.value);
  }

  return <>
    <CheckoutGrid>
      <div style="grid-area: qr" class="flex flex-col gap-4 items-center justify-center">
        <div className="mt-8 mb-4 mx-auto relative text-center">
          <QRCodeCanvas value={bip21Request} className={!!ready || makingPledge || madePledge ? 'invisible' : ''}></QRCodeCanvas> 
          <div className={`${!ready && !makingPledge && !madePledge ? 'hidden' : ''}`}>
            <div className={`absolute inset-0 z-10 flex justify-center items-center`}>
              <CompleteCheckmarkLoader loadComplete={madePledge} ></CompleteCheckmarkLoader>
            </div>
            <div className={`${!ready ? 'hidden' : ''} text-gray-700 mt-4`}>{statusText}</div>
          </div>
        </div>
      </div>
      { !ready && !makingPledge && !madePledge && <>
        <div style="grid-area: copy;" className="flex items-center justify-center">
          <button class="w-2/3 sm:w-auto justify-center inline-flex items-center rounded-2xl text-center text-white py-2 px-4 rounded-full bg-gradient-to-r from-green-500 to-green-700" onClick={onCopyAddress}>{ showSuccessfulAddressCopy ? "Copied" : "Copy Address"}</button>
        </div>
        <div style="grid-area: open;" className="flex items-center justify-center">
          <a href={bip21Request} class="w-2/3 sm:w-auto justify-center inline-flex items-center rounded-2xl text-center text-white py-2 px-4 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-700">Open in wallet</a>
        </div>
        <div style="grid-area: check;" className="flex items-center justify-center">
          <button class="xs:w-2/3 justify-center inline-flex items-center rounded-2xl text-center py-2 px-4 rounded-full border border-green-600 text-green-600" onClick={onCheckBalance}>{ isFetchingUtxos ? "Loading..." : "Check balance" }</button>
        </div>
      </> }
      <div style="grid-area: amount;" class="xs:p-8">
        <div class="mb-4 text-center xs:text-left"><b>Your donation</b></div>
        <dl class="grid grid-cols-2 text-gray-500">
          <dt class="">Total</dt>
          <dd data-testid="checkoutTotalAmount" class="text-right mb-2"><span class="whitespace-nowrap">{donationAmountText} {donationAmountDenomination}</span></dd>
          
          <dt class="pr-4">Fees</dt>
          <dd data-testid="checkoutNetworkFeesAmount" class="text-right mb-2"><span class="whitespace-nowrap">{feesAmountText} SATS</span></dd>

          <dt class="pr-4">Avail. Bal.</dt>
          <dd data-testid="checkoutAvailableAmount" class="text-right mb-2"><span class="whitespace-nowrap">{availableAmountText} {availableAmountDenomination}</span></dd>
          
          <dt class="pr-4 pt-4 text-gray-700 font-semibold">Requesting</dt>
          <dd data-testid="checkoutRequestingAmount" class="text-right pt-4 text-gray-700 font-semibold"><span class="whitespace-nowrap">{requestingAmountText} {requestingAmountDenomination}</span></dd>
        </dl>
        { showError && <div class="flex gap-2 items-center my-2 text-red-500"><span class="icon-info"></span><span class="">Something went wrong. Please try again.</span></div> }
      </div> 
    </CheckoutGrid>
    {(!!ready || makingPledge || madePledge) && <div class="pb-4">
        <div className="my-4 text-sm font-bold">Auto-refund address if campaign expires: </div>
        <div class="flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
          <input disabled={makingPledge || madePledge} defaultValue={previousAddress} class="w-full peer text-black outline-0" id="alias" type="text" name="alias" placeholder="&nbsp;" onChange={onRefundAddressChanged}></input>
          <FloatingLabel for="alias" className="absolute top-1 left-4 translate-y-3 bg-transparent">Address</FloatingLabel>
        </div>
        {!!clickedPledged && !userRefundAddressDirty && !!previousAddress && <div class="ml-2 text-md text-red-500"><span className="underline">Caution</span>: if this address originated from an <strong>exchange</strong>, change it before pledging.</div> }
        {!!clickedPledged && !!userRefundAddressDirty && !userRefundAddress && <div class="ml-2 text-md text-red-500"><span className="underline">Caution</span>: empty refund address! You will have to manually revoke using the private key above.</div> }
    </div> }
  </>
}

function getStatus(pledgeMutation) {
  let statusText = ""

  if (pledgeMutation.pledgeStatus === "setup") {
    statusText = "Creating setup transaction"
  } else if (pledgeMutation.pledgeStatus === "ipfs") {
    statusText = "Uploading commitment to decentralized web"
  } else if (pledgeMutation.pledgeStatus === "notification") {
    statusText = "Creating notification transaction"
  } else if (pledgeMutation.pledgeStatus === "fullfillment") {
    statusText = "Creating fullfillment transaction"
  } else if (pledgeMutation.pledgeStatus === "setup.broadcast") {
    statusText = "Broadcasting setup transaction"
  } else if (pledgeMutation.pledgeStatus === "notification.broadcast") {
    statusText = "Broadcasting notification transaction"
  } else if (pledgeMutation.pledgeStatus === "fullfillment.broadcast") {
    statusText = "Broadcasting fullfillment transaction"
  } else if (pledgeMutation.pledgeStatus === "lock") {
    statusText = "Locking committed utxo"
  } else if (pledgeMutation.isSuccess) {
    statusText = "Pledge successful!"
  } else if (pledgeMutation.isLoading) {
    statusText = "Loading pledge data"
  } else {
    statusText = "Ready to pledge!"
  }

  return statusText;
}