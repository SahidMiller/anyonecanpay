import { blockchainQueryKeys } from "./blockchain.js";
import { validateContribution, verifyContributionData, parseNotificationTransaction, contributionFromTransaction } from "@ipfs-flipstarter/utils/common";
import { getAddressScriptHash, feesFor } from "@ipfs-flipstarter/utils/helpers";

import { toString as uint8arrayToString } from "uint8arrays/to-string";
import { concat as uint8arrayConcat } from "uint8arrays/concat";
import all from "it-all";
import moment from "moment";

import bitcoinCashLib from "@psf/bitcoincashjs-lib";
const {Transaction, Block} = bitcoinCashLib;

function getNotificationKey(recipients) {
  const address = recipients?.[0]?.address;
  if (!address) throw new Error("invalid recipient key");
  return getAddressScriptHash(address);
}

function getApplicationDataKey(contribution) {
  return [
    contribution.address,
    contribution.cid
  ]
}

function getRecipientsKey(recipients) {
  const recipientsKey = recipients.reduce((key, recipient) => {
    return key + `${recipient.address},${recipient.satoshis};`
  }, "");

  return recipientsKey;
}

function getRecipientsValue(recipientsKey = "") {
  const recipients = recipientsKey.split(";").filter(Boolean).map((recipientKey) => {
    const [address = "", satoshis = 0] = recipientKey.split(",");
    if (address && satoshis) return { address, satoshis: Number(satoshis) };
    throw new Error("Invalid recipients");
  });

  return recipients;
}

const contributionQueryKeys = {
  all: () => ['contributions'],
  getApplicationData: (contribution) => ['contributions', 'getApplicationData', ...getApplicationDataKey(contribution)],
  getContributions: (recipients) => ['contributions', 'getContributions', getRecipientsKey(recipients)],
  getNotificationTxs: (recipients) => blockchainQueryKeys.transactionHistory(getNotificationKey(recipients))
}

function registerContributionQueries(queryClient, { createIpfs, defaultGatewayUrl } = {}) {
  queryClient.setQueryDefaults(contributionQueryKeys.all(), {
    queryFn: ({ queryKey }) => {
      const [, scope, ...args] = queryKey;

      if (scope === 'getApplicationData') {
        const [address, cid] = args;
        return getApplicationData(createIpfs, defaultGatewayUrl, address, cid);
      }

      if (scope === 'getContributions') {
        const [recipientsKey] = args;
        const recipients = getRecipientsValue(recipientsKey);
        return getContributions(queryClient, recipients);
      }

      throw new Error("unimplmented");
    },
    cacheTime: 0,
  })
}

async function getContributions (queryClient, recipients) {
  const requestingSatoshis = recipients.reduce((sum, { satoshis }) => sum + satoshis, 0);

  const notificationTransactionHashes = await queryClient.fetchQuery(contributionQueryKeys.getNotificationTxs(recipients), {
    staleTime: 0
  });
  
  const notifications = await Promise.all(notificationTransactionHashes.map(async ({ txHash:notificationTransactionHash, height }) => {
    const notificationTransactionHex = await queryClient.fetchQuery(blockchainQueryKeys.transaction(notificationTransactionHash))
    const notificationTransaction = Transaction.fromHex(notificationTransactionHex);
    const notification = notificationTransaction && parseNotificationTransaction(notificationTransaction, recipients);
    return { ...notification, height, txHash: notificationTransactionHash }
  }));

  const commitments = {};

  notifications.forEach((notification) => {
    notification.commitments.map((commitment) => {
      const id = commitment.txHash + ":" + commitment.txIndex;
      const existingCommitment= commitments[id];
      
      //If a contribution already exists merge the two or set as part of the new return
      if (existingCommitment) {
        commitments[id] = { ...existingCommitment, ...commitment }
      } else {
        commitments[id] = commitment;
      }
    });
  });

  const contributions = (await Promise.all(Object.values(commitments).map(async (commitment) => {
    const commitmentTransactionHex = await queryClient.fetchQuery(blockchainQueryKeys.transaction(commitment.txHash));
    const committedTransaction = Transaction.fromHex(commitmentTransactionHex);
    const contributionData = contributionFromTransaction(committedTransaction, commitment.txIndex);
    const contribution = { ...commitment, ...contributionData };
    const isValid = validateContribution(contribution, recipients);
    
    if (isValid) {
      
      if (contribution.fullfillment) return contribution;
      
      const unspentUtxos = await queryClient.fetchQuery(blockchainQueryKeys.utxos(contribution.scriptHash), {
        staleTime: 30000,
      });

      const isUnspent = !!unspentUtxos.find((utxo) => utxo.txHash === contribution.txHash && utxo.txIndex === contribution.txIndex)

      return isUnspent ? contribution : null;
    }

  }))).filter(Boolean)

  const totalRaised = contributions.reduce((sum, contribution) => sum + contribution.satoshis, 0);
  const fullfillmentNotification = notifications.find(notification => notification.isFullfillment);

  let fullfillmentFees = feesFor(contributions.length, recipients.length);
  if (totalRaised + fullfillmentFees <= requestingSatoshis) {
    //If not enough to fullfill, then fullfillment fee is at minimum +1 contribution.
    fullfillmentFees = feesFor(contributions.length + 1, recipients.length);
  }
  
  let fullfillmentTimestamp;
  if (fullfillmentNotification) {

    if (fullfillmentNotification.height > 1) {
      const fullfillmentBlockHeaderHex = await queryClient.fetchQuery(blockchainQueryKeys.blockHeader(fullfillmentNotification.height));
      const fullfillmentBlockHeader = Block.fromHex(fullfillmentBlockHeaderHex);
      fullfillmentTimestamp = fullfillmentBlockHeader.timestamp;
    } else {
      const queryState = await queryClient.getQueryState(blockchainQueryKeys.transaction(fullfillmentNotification.txHash));
      fullfillmentTimestamp = Math.floor(queryState.dataUpdatedAt / 1000);
    }
  }

  return { isFullfilled: !!fullfillmentNotification, fullfillmentTimestamp, totalRaised, contributions, fullfillmentFees }
}

async function getApplicationData(createIpfs, defaultGatewayUrl, address, cid) {

  if (!cid) return null;

  try {
    
    if (defaultGatewayUrl) {

      const remoteFetchResult = await fetch(defaultGatewayUrl + "/ipfs/" + cid + "/");
      const commitmentData = await remoteFetchResult.json();
      
      if (verifyContributionData(address, commitmentData)) {
        return commitmentData.applicationData;
      }
    }

  } catch(err) {
    console.log("Error fetching contribution from remote", err);
  }

  try {
    
    const ipfs = await createIpfs;
    
    if (ipfs) {
      const commitmentData = JSON.parse(uint8arrayToString(uint8arrayConcat(await all(ipfs.cat(cid, { 
        timeout: process.env.NODE_ENV === 'development' ? 20000 : 5000 
      })))));
      
      if (verifyContributionData(address, commitmentData)) {
        return commitmentData.applicationData;
      }
    }

  } catch (err) {
    throw new Error("Unable to fetch application data");
  }
}

export { contributionQueryKeys, registerContributionQueries }
