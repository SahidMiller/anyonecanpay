import ElectrumContext from "../contexts/electrum.js";

export function ElectrumProvider({ children, electrum }) {

  return <ElectrumContext.Provider value={electrum}>  
    {children}
  </ElectrumContext.Provider>
}

export default ElectrumProvider