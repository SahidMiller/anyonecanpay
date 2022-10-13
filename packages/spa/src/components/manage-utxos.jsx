import useToggleUtxoLock from "../hooks/useToggleUtxoLock.js";
import useWalletUtxosQuery from "../hooks/useWalletUtxosQuery.js";

export default function ManageUtxos({ onRefundClicked }) {
  
  const toggleUtxoLock = useToggleUtxoLock();
  const { data:utxos } = useWalletUtxosQuery();

  function onToggleLock(utxo) {
    return toggleUtxoLock.mutateAsync(utxo);
  }

  return <div class="overflow-x-auto w-full">{ !utxos?.length ? 
    <div class="text-center text-gray-600 text-lg py-6 font-thin">No utxos found in this wallet.</div> 
    : <table class="table w-full">
      {/* <!-- head --> */}
      <thead>
        <tr>
          <th class="pr-2">Locked</th>
          <th>Height</th>
          <th>Transaction</th>
          <th>Satoshis</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        { utxos.map((utxo) => {
          return <tr key={utxo.txHash + ":" + utxo.txIndex} class="utxo-item">
            <th class="isLocked-col pr-2">
              <input type="checkbox" class="checkbox" checked={!!utxo.isLocked} onChange={() => onToggleLock(utxo)} />
            </th>
            <td class="height-col pr-2">{ utxo.height }</td>
            <td class="txid-col pr-2">
              <div class="text-sm"><a class="text-blue-500" target="_blank" href={`https://blockchair.com/bitcoin-cash/transaction/${utxo.txHash}`} alt={utxo.txHash}>{ utxo.txHash.slice(0, 12) }:{ utxo.txIndex }</a></div>
              { utxo.isCommitted && <><br/><span class="badge badge-ghost badge-sm">Committed</span></> }
            </td>
            <td class="satoshis-col pr-2">{ utxo.satoshis }</td>
            <th class="refund-col">
              <button class="btn btn-ghost btn-xs" onClick={() => onRefundClicked(utxo)}>refund</button>
            </th>
          </tr>}) 
        }
      </tbody>    
    </table>
  }</div>
}
