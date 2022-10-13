import { useMemo } from 'react'
import WalletStore from "../stores/wallet";

/**
 * @returns {import('@ipfs-flipstarter/utils/web-wallet').FlipstarterWallet}
 */
export function useWallet() {
  const { wallet } = WalletStore.useState();
  return wallet;
}

export default useWallet;