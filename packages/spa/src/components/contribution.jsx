import prettyPrintSats from "../utils/prettyPrintSats.js";
import { useQuery } from 'react-query';
import { Transaction } from "@psf/bitcoincashjs-lib"
import moment from "moment";
import { useMemo, useCallback } from "react"
import { useIpfs } from "../hooks/useIpfs.js"
import { contributionQueryKeys } from '../queries/contributions.js';
import useBroadcastTransaction from "../hooks/useBroadcastTransaction.js";

export default function ContributionRow({ contribution, showSelect, selected, onToggle, ...props }) {
  const [amountText, amountDenomination] = prettyPrintSats(contribution.satoshis);
  
  const { ipfs } = useIpfs();
  const broadcastTransaction = useBroadcastTransaction();

  const { data: contributionData } = useQuery(contributionQueryKeys.getApplicationData(contribution), {
    staleTime: 30 * 1000,
    enabled: !!ipfs
  }) || {};

  const refundValid = useMemo(() => {
    if (!contributionData?.refundTx) return;
    const tx = Transaction.fromHex(contributionData?.refundTx);
    const locktime = tx.locktime;
    if (locktime > 500000000) {
      return moment.unix(locktime) < moment();
    }
  }, [contributionData?.refundTx]);

  const onRefundTransaction = useCallback(() => {
    broadcastTransaction.mutate(contributionData.refundTx);
  }, [contributionData?.refundTx]);

  const onStatusView = useCallback(() => {

  }, []);


  return <tr >
    { showSelect ? <th class="pr-2 text-center">
      <label>
        <input type="checkbox" class="checkbox" checked={!!selected} onChange={onToggle} />
      </label>
    </th> : <></> }
    <td class="pr-2">
      <div class="text-sm"><a class="text-blue-500" target="_blank" href={`https://blockchair.com/bitcoin-cash/transaction/${contribution.txHash}`} alt={contribution.txHash}>{ contribution.txHash.slice(0, 12) }:{ contribution.txIndex }</a></div>
    </td>
    <td class="pr-2">
      { contribution.fullfillment ? 
          <span class="bg-green-300 p-1 rounded text-white text-sm">Fullfillment</span> : 
          <span class="bg-gray-300 p-1 rounded text-white text-sm">Verified</span>
      }
    </td>
    <td class="pr-2">{ amountText } { amountDenomination }</td>
    <th>
      <button class="bg-gray-300 hover:bg-gray-500 p-1 rounded text-black text-opacity-60 hover:text-opacity-100 text-sm" onClick={refundValid ? onRefundTransaction : onStatusView}>{ refundValid ? "refund" : "status" }</button>
    </th>
  </tr>
}