import bchaddr from 'bchaddrjs'
import { SATS_PER_BCH, MIN_SATOSHIS } from "../utils/bitcoinCashUtilities.js"
import validateUrl from "valid-url";

// Check if URL is valid
export function validateURL(textval) {
  return !!validateUrl.isWebUri(textval);
}

export function validateBchAddress(value) {
  if (!value) return true;
  return bchaddr.isValidAddress(value) && ! bchaddr.isLegacyAddress(value);
}

export function bchToSats(bch) {
  const sats = Math.round(parseFloat(bch) * SATS_PER_BCH);
  return sats;
}

export function validateBch(val) {
  const sats = bchToSats(val);
  return sats >= MIN_SATOSHIS;
}