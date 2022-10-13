const SATS_PER_BCH = 100000000;

/**
 * Helper function that provides the dust limit standardness parameter.
 *
 * @returns the dustlimit in satoshis.
 */
const MIN_SATOSHIS = 546;

/**
 * Helper function that provides the max satoshis that is spendable.
 *
 * @returns the dustlimit in satoshis.
 */
const MAX_SATOSHIS = 2099999997690000;

const COMMITMENTS_PER_TRANSACTION = 650

// Define byte weights for different transaction parts.
const AVERAGE_BYTE_PER_CONTRIBUTION = 296;

const TRANSACTION_METADATA_BYTES = 10;

const AVERAGE_BYTE_PER_RECIPIENT = 69;

function calculateTotalRecipientMinerFees(RECIPIENT_COUNT, TARGET_FEE_RATE = 1) {
  return (
    (AVERAGE_BYTE_PER_RECIPIENT * RECIPIENT_COUNT) + 
    (TRANSACTION_METADATA_BYTES)
  ) * TARGET_FEE_RATE;
}

function calculateTotalContributorMinerFees(CONTRIBUTION_COUNT, TARGET_FEE_RATE = 1) {
  // Calculate the miner fee necessary to cover a fullfillment transaction for each contribution contribution.
  return (AVERAGE_BYTE_PER_CONTRIBUTION * (CONTRIBUTION_COUNT)) * TARGET_FEE_RATE;
};

function calculateActualFeeRate(recipientCount, requestedSatoshis, contributionCount, committedSatoshis) {
  // calculate real fee rate by:
  // 1. getting total bytes (fee rate of 1 sat per byte)
  // 2. getting actual fee in satoshis (total committed minus what was requested)
  // 3. divide actual fee sats by bytes to get sat per byte
  if (committedSatoshis < requestedSatoshis || recipientCount === 0 || contributionCount === 0) {
    return
  }

  return (committedSatoshis - requestedSatoshis) / (
    calculateTotalRecipientMinerFees(recipientCount, 1) +
    calculateTotalContributorMinerFees(contributionCount, 1)
  )
}

export { 
  SATS_PER_BCH,
  MIN_SATOSHIS,
  MAX_SATOSHIS,
  COMMITMENTS_PER_TRANSACTION,
  AVERAGE_BYTE_PER_CONTRIBUTION,
  TRANSACTION_METADATA_BYTES,
  AVERAGE_BYTE_PER_RECIPIENT,
  calculateTotalRecipientMinerFees,
  calculateTotalContributorMinerFees,
  calculateActualFeeRate,
}