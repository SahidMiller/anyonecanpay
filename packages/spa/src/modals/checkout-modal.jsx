import { useState } from "react";

import Modal from "../components/modal.jsx";
import PrimaryButton from "../components/inputs/primary-button.jsx";
import SecondaryButton from "../components/inputs/secondary-button.jsx";
import ManageUtxos from "../components/manage-utxos.jsx";
import RefundUtxo from "../components/refund-utxo.jsx";
import Checkout from "../components/checkout-view.jsx";
import useWallet from "../hooks/useWallet.js";

export default function CheckoutModal({ defaultView="checkout", donationAmount, alias, comment, refundTimestamp, onHide, isFullfillment = false }) {
  const { wif } = useWallet();
  const [showKey, setShowKey] = useState(false);
  const [showRefundUtxo, setShowRefundUtxo] = useState(null);
  const [showManageUtxos, setShowManageUtxos] = useState(defaultView === "refund");
  const [primaryButtonData, setPrimaryButtonData] = useState();

  function onShowKey(e) {
    setShowKey(true);
  }

  function onHideKey(e) {
    e.stopPropagation();
    setShowKey(false);
  }

  function onRefundSuccess() {
    setPrimaryButtonData(null);
    setShowRefundUtxo(null);
  }

  function onUtxoSelected(utxo) {
    setPrimaryButtonData(null);
    setShowRefundUtxo(utxo);
  }

  function onToggleView(e) {
    e.preventDefault(); 
    setPrimaryButtonData(null);
    setShowManageUtxos(!showManageUtxos); 
    setShowRefundUtxo(null);
  }

  const subheading = <>
    This is a <em>non-custodial crowdfunding</em> web application. Funds will not leave this wallet unless the campaign reaches it's goal. {/* <a class="text-blue-400 cursor-pointer" href="/">Learn more.</a> */}
    { !showRefundUtxo ? <div 
      class="bg-green-200 mt-6 p-4 text-center text-xs text-gray-900 cursor-pointer relative" 
      onClick={onShowKey}>
        <div class="flex flex-row gap-4 items-center justify-around">
          { showKey ? 
          <>
            <div className="cursor-text break-words overflow-hidden">{wif}</div>
            <div className="h-full bg-gray-400 px-4 py-2 text-center inline-flex justify-center items-center rounded text-white shadow-xl cursor-pointer hover:bg-gray-500" onClick={onHideKey}>Hide</div>
          </> : "Click here to show your web wallet's private key. This can be used to revoke your pledge." }
        </div>
    </div> : <div className="mt-8 mb-4 text-sm font-bold">Where would you like to send this UTXO?</div>
  }</>

  const footer = <div class="flex flex-row flex-wrap sm:items-center justify-center sm:justify-end gap-2">
    <SecondaryButton onClick={(e) => onHide?.(true)}><span>Cancel</span></SecondaryButton>
    { primaryButtonData && <PrimaryButton 
      disabled={!!primaryButtonData && !!primaryButtonData?.disabled}
      onClick={primaryButtonData && primaryButtonData?.onClick}>
      <span>{ primaryButtonData && primaryButtonData?.text}</span>
    </PrimaryButton> }
    <a class="mr-auto text-blue-500 underline pl-1 pb-1 sm:pl-0 sm:pr-0 sm:order-first" href="" onClick={onToggleView}>{showManageUtxos ? "Back to checkout" : "Manage wallet"}</a>
  </div>

  return <Modal 
    heading="Ready for checkout?" 
    subheading={subheading} 
    footer={footer}>
      <div>{
        showManageUtxos && showRefundUtxo ? <RefundUtxo 
          utxo={showRefundUtxo} 
          onRefunded={onRefundSuccess}
          setPrimaryButtonData={setPrimaryButtonData}
        /> : showManageUtxos ? <ManageUtxos 
          onRefundClicked={onUtxoSelected} 
          setPrimaryButtonData={setPrimaryButtonData}
        /> : <Checkout
          setPrimaryButtonData={setPrimaryButtonData}
          alias={alias}
          comment={comment}
          donationAmount={donationAmount}
          refundTimestamp={refundTimestamp}
          isFullfillment={isFullfillment}
        ></Checkout>
      }</div>
  </Modal>
}