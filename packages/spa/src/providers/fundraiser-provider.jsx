import { useMemo } from "react"
import FundraiserContext from "../contexts/fundraiser.js";

const defaultValue = {};
export function FundraiserProvider({ children, campaign }) {
  const campaignData = useMemo(() => {
    const requestedAmount = (campaign?.recipients || []).reduce((sum, recipient) => {
      return sum + recipient.satoshis;
    }, 0);

    return { ...campaign, requestedAmount }

  }, [campaign]);

  return <FundraiserContext.Provider value={campaignData || defaultValue}>  
    {children}
  </FundraiserContext.Provider>
}

export default FundraiserProvider;