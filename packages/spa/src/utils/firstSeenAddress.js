import { get, set } from "idb-keyval"

export async function getFirstSeenAddress() {
  const returnAddress = await get("RETURN_ADDRESS")
  return returnAddress;
}

export async function setFirstSeenAddress(address) {
  await set("RETURN_ADDRESS", address)
  return address
}