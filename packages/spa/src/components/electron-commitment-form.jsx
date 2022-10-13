import { useState, useEffect, useCallback } from "react";
import useCopy from "../hooks/useCopy.js";
import useExternalWalletPayload from "../hooks/useExternalWalletPayload.js";
import { useValidateExternalCommitmentQuery } from "../hooks/useValidateExternalCommitment.js";

import FloatingLabel from "./inputs/floating-label.jsx";

export function ElectronCommitmentForm({ setHeading, donationAmount, setDisablePrimaryButton, setElectronCommitment }) {
  useEffect(() => {
    setHeading("First, copy the following data to the EC Flipstarter Plugin...");
  }, []);
  
  const [userCommitmentPayload, setUserCommitmentPayload] = useState(null);
  const externalWalletPayload = useExternalWalletPayload(donationAmount);
  const [copyExternalWalletPayload, copyExternalSuccess] = useCopy(externalWalletPayload);

  const onExternalPayloadClick = useCallback((e) => {
    e.target.focus();
    e.target.select();
    copyExternalWalletPayload();
  }, [copyExternalWalletPayload]);

  const onCommitmentResultChange = useCallback((e) => {
    setUserCommitmentPayload(e.target.value)
  }, [setDisablePrimaryButton]);

  const { 
    isLoading:showResultLoading, 
    error:resultException, 
    data:electronCommitment 
  } = useValidateExternalCommitmentQuery(userCommitmentPayload);
  const showResultError = userCommitmentPayload && (!showResultLoading && !electronCommitment) || resultException;

  useEffect(() => {
    if (electronCommitment) {
      setDisablePrimaryButton(false);
      setElectronCommitment(electronCommitment);
    }
  }, [electronCommitment, setDisablePrimaryButton, setElectronCommitment]);

  return <>
    <div class="flex relative border rounded m-1 text-gray-500">
      <textarea id="outgoingPayload" name="outgoingPayload" readonly onClick={onExternalPayloadClick} class="h-24 w-full border rounded p-4 overflow-hidden" value={externalWalletPayload}>
      </textarea>
      <FloatingLabel for="outgoingPayload" className="absolute top-1 left-4 -translate-y-3.5 bg-white text-black">Copy to plugin</FloatingLabel>
      <div className="absolute inset-y-1/2 right-5 bg-gray-400 p-4 text-center inline-flex justify-center items-center rounded text-white -translate-y-1/2 shadow-xl cursor-pointer hover:bg-gray-500" onClick={onExternalPayloadClick}>{ copyExternalSuccess ? "Copied!" : "Copy" }</div>
    </div>
    <div class="flex relative border rounded m-1 text-gray-500 mt-4">
      <div class="h-24 w-full border rounded py-4 pb-0">
        <textarea id="incomingPayload" name="incomingPayload" class="w-full h-full px-4 outline-none overflow-hidden" onChange={onCommitmentResultChange}>
        </textarea>
        <FloatingLabel for="incomingPayload" className="absolute top-1 left-4 -translate-y-3.5 bg-white text-black">Paste the result</FloatingLabel>
      </div>
    </div>
    {!!showResultError && !showResultLoading ? <div className={`text-red-600 pl-4 pt-2 font-bold`}>We had an error decoding this.</div> : <></> }
    { showResultLoading ? <div className={`pl-4 pt-2 font-bold text-green-500`}>Validating...</div> : <></> }
  </>
}