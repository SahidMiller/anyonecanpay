import { Store } from "pullstate";

export const WalletStore = new Store({
  wallet: {},
  electrum: null
});

export default WalletStore