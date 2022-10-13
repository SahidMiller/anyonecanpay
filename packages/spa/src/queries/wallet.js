import { getFrozenUtxos } from "../utils/frozen-coins";
import { getFirstSeenAddress, setFirstSeenAddress } from '../utils/firstSeenAddress.js';
import { blockchainQueryKeys } from "../queries/blockchain";

import { CID } from "ipfs"
import { MIN_SATOSHIS } from "../utils/bitcoinCashUtilities" 

import { feesFor, parseAddressFromOutputScript } from "@ipfs-flipstarter/utils/helpers";
import { notificationFee } from "@ipfs-flipstarter/utils/web-wallet";

import bitcoinCashLib from "@psf/bitcoincashjs-lib";
const {Transaction} = bitcoinCashLib;

const walletQueryKeys = {
  all: () => ['wallet'],
  utxos: (scriptHash) => ['wallet', 'utxos', scriptHash],
  frozenUtxos: () => ['wallet', 'frozenUtxos'],
  balance: (scriptHash) => ['wallet', 'balance', scriptHash],
  refundAddress: (scriptHash) => ['wallet', 'refundAddress', scriptHash],
  checkoutStatus: (scriptHash, donationAmount) => ['wallet', 'checkoutStatus', scriptHash, donationAmount],
  addIpfs: (additionalKeys = []) => ['addIpfs', ...additionalKeys]
}

function registerWalletQueries(queryClient, electrum, ipfs, defaultApiUrl) {
  queryClient.setQueryDefaults(walletQueryKeys.all(), {
    queryFn: ({ queryKey }) => {
      const [, scope, ...args] = queryKey;

      if (scope === 'frozenUtxos') {
        return getFrozenCoins();
      }

      if (scope === 'utxos') {
        const [scriptHash] = args;
        return getWalletUtxos(queryClient, scriptHash);
      }

      if (scope === 'balance') {
        const [scriptHash] = args;
        return getWalletBalance(queryClient, scriptHash);
      }

      if (scope === 'refundAddress') {
        const [scriptHash] = args;
        return getRefundAddress(queryClient, scriptHash);
      }
    }
  });

  // Define the "addTodo" mutation
  queryClient.setMutationDefaults(walletQueryKeys.addIpfs(), {
    mutationFn: ({ commitmentData, applicationData, applicationDataSignature, recipients }) => {
      return hashCommitmentData(ipfs, defaultApiUrl, commitmentData, applicationData, applicationDataSignature, recipients);
    },
    onError: (error, variables, context) => {
      
    },
    retry: 3,
  });
}

async function getFrozenCoins() {
  return Promise.resolve(getFrozenUtxos()).catch(() => { 
    return []; 
  });
}

async function getWalletUtxos(queryClient, scriptHash) {

  const [utxos, frozenUtxos] = await Promise.all([
    queryClient.fetchQuery(blockchainQueryKeys.utxos(scriptHash), {
      enabled: !!scriptHash,
      staleTime: 0,
    }),
    queryClient.fetchQuery(walletQueryKeys.frozenUtxos(), {
      staleTime: 2000
    }),
  ]);

  const availableUtxos = utxos.map(utxo => ({
    ...utxo,
    isLocked: frozenUtxos.indexOf(utxo.txHash + ":" + utxo.txIndex) !== -1
  }));

  return availableUtxos;
}

async function getWalletBalance(queryClient, scriptHash) {
  const utxos = await queryClient.fetchQuery(walletQueryKeys.utxos(scriptHash), {
    enabled: !!scriptHash,
    staleTime: 2000,
  })
  const availableUtxos = utxos.filter(utxo => !utxo.isLocked);
  const walletBalance = availableUtxos.reduce((sum, utxo) => sum + utxo.satoshis, 0);
  return walletBalance;
}

async function getRefundAddress(queryClient, scriptHash) {

  const previousAddress = await getFirstSeenAddress();

  if (previousAddress) return previousAddress;
  
  const utxos = await queryClient.fetchQuery(blockchainQueryKeys.utxos(scriptHash), { 
    enabled: !!scriptHash, 
    staleTime: 0 
  });

  if (!utxos.length) return null;

  const [firstUtxo] = utxos;
  const transactionHex = await queryClient.fetchQuery(blockchainQueryKeys.transaction(firstUtxo?.txHash));
  const transaction = Transaction.fromHex(transactionHex);
  const transactionInputs = transaction?.ins || [];
  const transactionInputAddresses = transactionInputs.map((vin) => {
    try {
      return parseAddressFromOutputScript(vin?.script);
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (transactionInputAddresses.length) {
    const previousAddress = transactionInputAddresses[0];
    await setFirstSeenAddress(previousAddress);
    return previousAddress;
  } else {
    return null;
  }
}

async function hashCommitmentData(ipfs, defaultApiUrl, commitmentData, applicationData, applicationDataSignature, recipients) {

  const ipfsInfo = {
    //Information necessary to verify legit by flipstarter gateways
    recipients: recipients,
    ...commitmentData,
    applicationData,
    applicationDataSignature,
    version: "0.0.0"
  };


  let localIpfsResult, remoteIpfsApiResult;

  try {
    localIpfsResult = (await ipfs.add(JSON.stringify(ipfsInfo))).cid.toV0().bytes;
  } catch (err) {
    console.log("Failed to upload to IPFS:", err);
  }

  try {
    
    let formData = new FormData();
    formData.append('files', new Blob([JSON.stringify(ipfsInfo)]));
    const apiFetchResult = await fetch(defaultApiUrl + '/api/v0/add?cid-version=0', { method: 'POST', body: formData });
    const apiResult = await apiFetchResult.json();
    remoteIpfsApiResult = CID.parse(apiResult.Hash)?.toV0()?.bytes;

  } catch (err) {
    console.log("Failed to upload to default server");
    if (!localIpfsResult) {
      throw err;
    }
  }

  if (remoteIpfsApiResult && localIpfsResult && remoteIpfsApiResult.toString('hex') !== localIpfsResult.toString('hex')) {
    console.log("Remote and local mismatch", "Remote: " + remoteIpfsApiResult.toString(), "Local: " + localIpfsResult.toString());
    return localIpfsResult;
  }

  return remoteIpfsApiResult || localIpfsResult;
}

export { walletQueryKeys, registerWalletQueries }