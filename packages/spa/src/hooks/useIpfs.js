import { useContext } from "react"
import IpfsContext from "../contexts/ipfs.js"

/**
 * 
 * @returns {{ipfs: import('ipfs-core').IPFS, error:string?}}
 */
 export const useIpfs = () => useContext(IpfsContext);
 export default useIpfs;