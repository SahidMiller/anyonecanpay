import { useContext } from "react"
import FundraiserContext from "../contexts/fundraiser.js"

export const useFundraiser = () => useContext(FundraiserContext);
export default useFundraiser;