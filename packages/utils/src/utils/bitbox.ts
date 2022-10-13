import Crypto from "@psf/bch-js/src/crypto.js";
import ScriptUtils from "@psf/bch-js/src/script.js";
import AddressUtils from "@psf/bch-js/src/address.js";
import HDNodeUtils from "@psf/bch-js/src/hdnode.js";
import BitcoinCashUtils from "@psf/bch-js/src/bitcoincash.js";
import TransactionBuilder from "@psf/bch-js/src/transaction-builder.js";
import ECPair from "@psf/bch-js/src/ecpair.js";
import ECSignature from "@psf/bitcoincashjs-lib/src/ecsignature.js";

export const Address = new AddressUtils({});
export const Script = new ScriptUtils();
export const BitcoinCash = new BitcoinCashUtils(Address);
export const HDNode = new HDNodeUtils(Address);

TransactionBuilder.setAddress(Address);
ECPair.setAddress(Address);

export { ECPair, Crypto, TransactionBuilder, ECSignature }