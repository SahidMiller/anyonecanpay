import { useContext } from "react"
import ElectrumContext from "../contexts/electrum.js"

export const useElectrum = () => useContext(ElectrumContext);
export default useElectrum;