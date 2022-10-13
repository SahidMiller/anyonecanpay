import { Mutex } from "async-mutex"
import { get, set } from "idb-keyval"

const freezeUtxoLock = new Mutex();

export async function getFrozenUtxos() {
  const unlock = await freezeUtxoLock.acquire();
  try {
    return await _getFrozenUtxos();
  } finally {
    unlock();
  }
}

export async function freezeUtxo(txHash, txIndex) {
  const unlock = await freezeUtxoLock.acquire();
  try {
    await _freezeUtxo(txHash, txIndex);
  } finally {
    unlock();
  }
}

export async function unfreezeUtxo(txHash, txIndex) {
  const unlock = await freezeUtxoLock.acquire();
  try {
    await _unfreezeUtxo(txHash, txIndex);
  } finally {
    unlock();
  }
}

async function _getFrozenUtxos() {
  const frozenUtxos = await get("LOCKED_UTXOS")
  return frozenUtxos ? JSON.parse(frozenUtxos) : [];
}

async function _freezeUtxo(txid, vout) {
  /** @type {Array<string>} */
  const lockedUtxos = await _getFrozenUtxos() || [];
  const key = txid + ":" + vout;

  //Already frozen
  if (lockedUtxos.indexOf(key) !== -1) return;
  
  lockedUtxos.push(key)

  await set("LOCKED_UTXOS", JSON.stringify(lockedUtxos));

  return lockedUtxos
}

async function _unfreezeUtxo(txid, vout) {
  /** @type {Array<string>} */
  const lockedUtxos = await _getFrozenUtxos() || [];
  const key = txid + ":" + vout;

  await set("LOCKED_UTXOS", JSON.stringify(lockedUtxos.filter(lockedKey => lockedKey !== key)));

  return lockedUtxos
}