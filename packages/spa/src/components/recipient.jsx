import prettyPrintSats from "../utils/prettyPrintSats.js"

export default function Recipient({recipient}) {
  const [amount, denomination] = prettyPrintSats(recipient.satoshis);

  return <>
    <li class="m-0 mb-4 p-0">
      <a class="block relative" href={`https://blockchair.com/bitcoin-cash/address/${recipient.address}`} target="_blank">
        { recipient.image && <img class="rounded-lg" src={recipient.image} alt={"Recipient: " + recipient.name} /> }
        <div class={`${recipient.image && "absolute bottom-0 absolute bg-gray-200 opacity-80 px-4 rounded-b-lg"} flex items-center justify-between w-full flex-wrap`}>
          <i class="icon-face basis-10 hidden xs:block" style="margin-top:0;"></i>
          <b class="mx-auto ml-0">{recipient.name}</b>
          <i title={`${amount} ${denomination}`}>{amount} {denomination}</i>
        </div>
      </a>
    </li>
  </>
}