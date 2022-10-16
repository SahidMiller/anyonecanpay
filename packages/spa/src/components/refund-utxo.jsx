import { useState, useEffect, useRef } from "react";
import useRefundAddressQuery from "../hooks/useRefundAddressQuery.js"
import FloatingLabel from "./inputs/floating-label.jsx";
import useRefundMutation from "../hooks/useRefundMutation.js";

export default function RefundUtxo({ utxo, onRefunded, setPrimaryButtonData }) {
  const [userRefundAddress, setUserRefundAddress] = useState();
  const [userRefundAddressDirty, setUserRefundAddressDirty] = useState(false);

  const { data:previousAddress } = useRefundAddressQuery();
  
  //Use previous address unless user changed the refundAddress
  const refundAddress = userRefundAddressDirty ? userRefundAddress : previousAddress;
  const refundUtxoMutation = useRefundMutation();

  async function onRefundClicked() {
    await refundUtxoMutation.mutateAsync({ utxo, refundAddress });      
    onRefunded();
  }

  function onRefundAddressChanged(e) {
    setUserRefundAddressDirty(true);
    setUserRefundAddress(e.target.value);
  }

  const makeRefundRef = useRef();
  makeRefundRef.current = onRefundClicked;

  useEffect(() => {
    setPrimaryButtonData?.({
      onClick: makeRefundRef.current,
      text: refundUtxoMutation.isSuccess ? "Done!" : refundUtxoMutation.isLoading ? "Loading..." : "Refund",
      disabled: !refundAddress || refundUtxoMutation.isLoading || refundUtxoMutation.isSuccess
    });
  }, [setPrimaryButtonData, refundAddress, refundUtxoMutation]);

  return <div>
    <div class="flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
      <input defaultValue={previousAddress} class="w-full peer text-black outline-0" id="address" type="text" name="alias" placeholder="&nbsp;" onChange={onRefundAddressChanged}></input>
      <FloatingLabel for="address" className="absolute top-1 left-4 translate-y-3 bg-transparent">Address</FloatingLabel>
    </div>
  </div>
}