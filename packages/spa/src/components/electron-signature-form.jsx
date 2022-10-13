import { useEffect, useCallback } from "react";
import FloatingLabel from "./inputs/floating-label.jsx";
import useCopy from "../hooks/useCopy.js";

export function ElectronSignatureForm({ setHeading, setPrimaryButton, onSignedMessageChanged, dataMessage, address, dataSignature, showSignatureError }) {
  const [copyDataMessage, copyDataMessageSuccess] = useCopy(dataMessage);
  const [copyAddress, copyAddressSuccess] = useCopy(address);

  useEffect(() => {
    setHeading("Sign your mesesage.");
  }, [setHeading]);

  useEffect(() => {
    setPrimaryButton(!dataSignature ? "Skip" : "Next")
  }, [setPrimaryButton, dataSignature]);

  const onSignMessageClick = useCallback((e) => {
    e.target.focus();
    e.target.select();
    copyDataMessage();
  }, [copyDataMessage]);

  const onAddressClick = useCallback((e) => {
    e.target.focus();
    e.target.select();
    copyAddress();
  }, [copyAddress]);

  return <>
    <div class="mx-auto text-base leading-relaxed text-gray-500">Paste in <b>Tools &gt; Sign/Verify Message</b> and click <b>Sign</b>. Copy the resulting signature here:</div>
    <fieldset className="flex flex-col gap-2 py-3">                 
      <div class="flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
        <input id="dataMessage" name="dataMessage" data-testid="electronCashSignDataMessage" onClick={onSignMessageClick} readonly value={dataMessage} class="peer w-full outline-none text-black"></input>
        <FloatingLabel for="dataMessage" className="absolute top-1 left-4 translate-y-3 bg-transparent">Message</FloatingLabel>
        <div className="absolute inset-y-1/2 right-5 bg-gray-400 p-4 text-center inline-flex justify-center items-center rounded text-white -translate-y-1/2 shadow-xl cursor-pointer hover:bg-gray-500" onClick={onSignMessageClick}>{ copyDataMessageSuccess ? "Copied!" : "Copy" }</div>
      </div>
      
      <div class="flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
        <input data-testid="electronCashAddress" value={address || ""} readonly class="peer w-full text-black outline-0" id="electronCashAddress" type="text" name="electronCashAddress" placeholder="&nbsp;" onClick={onAddressClick}></input>
        <FloatingLabel for="electronCashAddress" className="absolute top-1 left-4 translate-y-3 bg-transparent">Address</FloatingLabel>
        <div className="absolute inset-y-1/2 right-5 bg-gray-400 p-4 text-center inline-flex justify-center items-center rounded text-white -translate-y-1/2 shadow-xl cursor-pointer hover:bg-gray-500" onClick={onAddressClick}>{ copyAddressSuccess ? "Copied!" : "Copy" }</div>
      </div>

      <label for="dataSignature" class="mx-auto text-base leading-relaxed text-gray-500">Copy the resulting signature here:</label>
      <textarea id="dataSignature" name="dataSignature" class="flex relative border rounded m-1 p-4" onChange={onSignedMessageChanged}></textarea>
      <div className={`text-red-600 pl-4 font-bold ${!showSignatureError ? 'invisible' : ''}`}>This doesn't look like a valid signature, please try again.</div>
    </fieldset>
  </>
}
