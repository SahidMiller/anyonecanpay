import Recipient from "./recipient.jsx";
import pluralize from "../utils/pluralize.js";

export default function RecipientList({ recipients }) {
  const recipientCount = recipients.length;

  return <div class="recipient-list text-lg">
    <h1 class="text-2xl">Recipients</h1>
    <h2 class="text-sm mb-8 whitespace-nowrap">{ recipientCount } {pluralize({ singular: "recipient", count: recipientCount })}</h2>
    <ul>
      {
        recipients.map(recipient => {
          return <Recipient recipient={recipient}></Recipient>
        })
      }
    </ul>
  </div>
}