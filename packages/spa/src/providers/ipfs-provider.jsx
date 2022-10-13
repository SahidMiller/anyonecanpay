import { useState, useEffect } from "react"
import IpfsContext from "../contexts/ipfs.js";

export function IpfsProvider({ children, ipfs:userIpfs, createIpfs:userCreateIpfs }) {

  /** @type {[import('ipfs-core').IPFS]} */
  const [ipfs, setIpfs] = useState(userIpfs);
  const [error, setError] = useState(null);

  useEffect(async () => {
    if (ipfs) return;

    if (userIpfs) {
      setIpfs(userIpfs);    
    }
    
    if (userCreateIpfs) {
      try {
        const ipfs = await userCreateIpfs;
        setIpfs(ipfs);
      } catch (err) {
        console.log("Error loading IPFS:", err);
        setError(err);
      }
    }  
  }, [userIpfs, userCreateIpfs]);

  return <IpfsContext.Provider value={{ ipfs, error }}>  
    {children}
  </IpfsContext.Provider>
}