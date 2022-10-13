import { useState, useEffect } from "react"
import { useQueryClient } from 'react-query'

import useElectrum from "../hooks/useElectrum.js";
import useFundraiser from "../hooks/useFundraiser";

import WalletStore from "../stores/wallet.js"
import { FlipstarterWallet } from "@ipfs-flipstarter/utils/web-wallet";
import { get, set } from 'idb-keyval'

async function getSeedPhrase() {
  
  const base64SeedPhrase = await get("WALLET");
  
  if (base64SeedPhrase) {
    return atob(base64SeedPhrase);
  } else {
    
    const seedPhrase = await FlipstarterWallet.createSeedPhrase();
    await set("WALLET", btoa(seedPhrase));
    return seedPhrase;
  }
}

export function useConnectWallet() {
  const electrum = useElectrum();

  useEffect(async () => {
    try {
      const seedPhrase = await getSeedPhrase();
      const wallet = await FlipstarterWallet.create(seedPhrase);

      WalletStore.update((store) => {
        store.wallet = wallet;
      });
      
    } catch (err) {
      console.log("error creating wallet", err);
    }
  }, []);

  useEffect(async () => {

    if (!electrum) return;
    
    await electrum.ready();

    WalletStore.update((store) => {
      store.electrum = electrum;
    });

  }, [electrum]);
}