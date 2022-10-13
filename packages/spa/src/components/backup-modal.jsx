import Modal from "./modal.jsx";
import SecondaryButton from "./inputs/secondary-button.jsx";

import Checkbox from "./inputs/checkbox.jsx";
import { useState } from "react";
import { useWallet } from "../hooks/useWallet.js";

export default function BackupModal({ showKeepOption = true, keepWallet, onKeepWalletChanged, onHide, children }) {
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [hideKey, setHideKey] = useState(true);
  const { wif } = useWallet();

  function onSeedRevealed() {
    setKeyRevealed(true);
    setHideKey(!hideKey);
  }

  const subheading = <>
    This is a <em>non-custodial web wallet</em> so keep funds low unless you're comfortable. {/* <a class="text-blue-400 cursor-pointer" href="/">Learn more.</a> */}
  </>

  const footer = <div class="mt-6 flex  flex-wrap gap-2 justify-center sm:justify-start">
    <div class="mt-3 rounded-lg sm:mt-0 sm:ml-3">
      <button class="disabled:bg-gray-600 items-center block px-8 py-4 text-base font-medium text-center text-white transition duration-500 ease-in-out transform bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" onClick={onSeedRevealed}><span>{ !hideSeed ? "Hide key" : "Reveal key" }</span></button>
    </div>
    { keyRevealed && <div class="mt-3 rounded-lg sm:mt-0">
      <button class="items-center block px-10 py-3.5 text-base font-medium text-center text-green-600 transition duration-500 ease-in-out transform border-2 border-white shadow-md rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" onClick={onHide}><span>Done</span></button>
    </div> }
  </div>

  return <Modal 
    heading="Let's make sure you backup your wallet!" 
    subheading={subheading} 
    footer={footer}>
      <div class="mt-3 text-left sm:mt-5">

        <p class="mx-auto mt-2 text-base leading-relazed text-gray-500">Spending from this wallet or sweeping the private key will revoke your contributions.</p>
        
        { children ? <p class="mt-3 mx-auto text-base leading-relazed text-gray-500">
          { children }
        </p> : <></> }

        <p class="mx-auto my-8 text-base leading-relaxed text-2xl text-green-600">
          <div 
            class="bg-green-200 mt-6 p-4 text-center text-xs text-gray-900 cursor-pointer relative">
              <div class="flex flex-row gap-4 items-center justify-around">
                { !hideKey ? <>
                  <div className="cursor-text break-words overflow-hidden">{wif}</div>
                </> : "Reveal your private key below and store it for guaranteed access to funds." }
              </div>
          </div>
        </p>
      </div>
  </Modal>
}