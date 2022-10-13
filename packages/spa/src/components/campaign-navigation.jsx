import { useState } from "react";
import { useWallet } from "../hooks/useWallet.js";

import { Link } from "preact-router";

import { ReactComponent as Logo } from "../../public/img/ipfs-flipstarter-logo-black.svg"
import leftArrowSvg from "../../public/img/chevron-left-solid.svg"

import BackupModal from "./backup-modal.jsx";

async function loadSideshiftScript() {
  const id = "sideshiftScript"
  if (!document.getElementById(id)) {
    const script = document.createElement('script');
    
    script.id = id;
    script.src = 'https://sideshift.ai/static/js/main.jsx';
    
    document.body.appendChild(script);
    
    return new Promise((res, rej) => {
      script.onload = () => { 
        res();
      };
    });
  }
}

export default function Navigation({ isDonate = false, openWallet }) {
  const { address, seedPhrase } = useWallet();
  const [showBackupModal, setShowBackupModal] = useState(false);

  function openBackupModal() {
    document.activeElement.blur();
    setShowBackupModal(true);
    loadSideshiftScript().then(() => {
      
      window.__SIDESHIFT__ = {
        parentAffiliateId: "Q5Rcvkcp2",
        defaultDepositMethodId: "btc",
        defaultSettleMethodId: "bch",
        settleAddress: address,
      }
    });
  }

  async function closeBackupModal(e) {
    e.preventDefault();
    setShowBackupModal(false);

    await loadSideshiftScript()
    window?.sideshift?.show?.();
  }

  return <>
    <header className={`bg-white shadow-md w-full fixed z-10 ${ isDonate ? "sticky top-0 bg-white border-b shadow-sm z-10": ""}`}>
      <nav class={`bg-transparent grid grid-cols-3 items-center`}>
        <div>
          { !isDonate && <label htmlFor="my-drawer" class="btn btn-square btn-ghost text-lg !p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label> }
        </div>
        <a class="h-full flex justify-center" href={ !isDonate && "https://flipstarter.me"} target="_blank"><Logo style="width:120px;height: 100%;"></Logo></a>
        <div class="pr-2 text-right"><button class="p-1" onClick={openBackupModal} id="sideshift-modal-button">Need BCH?</button></div>
      </nav>
    </header>

    <div className="navbar bg-base-100 shadow-md w-full fixed z-10">
      <div className="navbar-start">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost btn-circle !p-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
          </label>
          <ul tabIndex={0} className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52">
            { isDonate && <li><Link className="active:bg-blue-500" href="/">Back</Link></li> }
            <li><a className="active:bg-blue-500" onClick={openWallet}>Manage wallet</a></li>
            <li className="sm:hidden"><a className="active:bg-blue-500 text-transparent bg-clip-text font-bold" style="background-image: linear-gradient(90deg, #f7931a 0%, #f7bf10 50%, #f7931a 100%)" onClick={openBackupModal}>Need BCH?</a></li>
          </ul>
        </div>
      </div>
      <div className="navbar-center">
        <a class="h-full flex justify-center" href={ !isDonate && "https://flipstarter.me"} target="_blank"><Logo style="width:120px;height: 100%;"></Logo></a>
      </div>
      <div className="navbar-end">
        <div class="pr-2 text-right hidden sm:block"><button class="p-1" onClick={openBackupModal} id="sideshift-modal-button">Need BCH?</button></div>
      </div>
    </div>

    { showBackupModal && <BackupModal seedPhrase={seedPhrase} showKeepOption={false} onHide={closeBackupModal}>
      <div class="font-bold text-center underline">Sideshift.ai is not available in certain countries.</div>
    </BackupModal> }
  </>
}