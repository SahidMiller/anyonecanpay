import { Router, route } from "preact-router";
import { createHashHistory } from "history";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Landing from "../pages/landing.jsx"
import DonationPage from "../pages/donate.jsx"
import Navigation from "../components/campaign-navigation.jsx";
import CheckoutModal from "../modals/checkout-modal.jsx";
import { useConnectWallet } from "../hooks/useCreateWallet.js";
import { useQueryClient } from "react-query";
import useWalletUtxosQuery from "../hooks/useWalletUtxosQuery.js"
import useIpfs from "../hooks/useIpfs";
import useElectrum from "../hooks/useElectrum";
import FundraiserProvider from "../providers/fundraiser-provider";
import { registerWalletQueries } from "../queries/wallet.js";
import { feesFor } from "@ipfs-flipstarter/utils/helpers"
import { MIN_SATOSHIS } from "../utils/bitcoinCashUtilities.js";

import "../../public/css/campaign.css";

import { DEFAULT_API_URL } from "../utils/constants.js";

const maxOpReturnBytes = 220;
const notificationFee = feesFor(1, 1) + maxOpReturnBytes + MIN_SATOSHIS;

export default function App({ campaign, initialValues, seedPhrase }) {
  useConnectWallet({ seedPhrase });
  
  const queryClient = useQueryClient();
  const { ipfs } = useIpfs();
  const electrum = useElectrum();
  const { data:utxos } = useWalletUtxosQuery();
  const balance = useMemo(() => {
    const balance = utxos.filter(utxo => !utxo.isLocked).reduce((s, u) => s + u.satoshis, 0);
    const fees = feesFor(utxos.length, 2) + notificationFee;
    return balance ? balance - fees : 0;
  }, [utxos]);
  const [hideCheckoutModal, setHideCheckoutModal] = useState(true);
  const [isDonate, setIsDonate] = useState(false);

  useEffect(() => {
    if (queryClient) {
      registerWalletQueries(queryClient, electrum, ipfs, DEFAULT_API_URL);
    }
  }, [queryClient, ipfs, electrum]);

  const openWallet = useCallback(() => {
    document.activeElement.blur()
    setHideCheckoutModal(false);
  }, []);

  const handleRoute = async e => {
    setIsDonate(e.url.startsWith("/donate"));
    route(e.url, true);
  };

  return <div id="main" class="clouds">
    <FundraiserProvider campaign={campaign}>
      <div class="flex flex-col min-h-screen relative text-sm">
        <Navigation isDonate={isDonate} openWallet={openWallet}></Navigation>
        <Router history={createHashHistory()} onChange={handleRoute}>
          <Landing default path="/" campaign={campaign} initialValues={initialValues}/>
          <DonationPage path="/donate/:defaultDonationAmount?:rest*" campaign={campaign}></DonationPage>
        </Router>
        { !hideCheckoutModal && <CheckoutModal 
          defaultView="refund"
          donationAmount={balance} 
          recipients={campaign.recipients}
          refundTimestamp={campaign.expires} 
          onHide={() => setHideCheckoutModal(true)}>
        </CheckoutModal> }
        { !!balance && <div class="fixed w-full bottom-0 bg-red-400 text-sm sm:text-lg text-white text-center center">
          Some funds in your wallet weren't pledged, <a onClick={() => setHideCheckoutModal(false)} class="cursor-pointer text-[#0d556b] font-bold">pledge or refund them now.</a>
        </div> }
        <footer class="center grass mt-auto" style="min-height: 110px; display: flex; align-items:center;justify-content:center;">
          <p>Powered by <a class="text-blue-600" href="https://flipstarter.cash" target="_blank">Flipstarter</a></p>
        </footer>
      </div>
    </FundraiserProvider>
  </div>
}