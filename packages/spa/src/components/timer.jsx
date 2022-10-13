import moment from "moment"

export default function Timer({ starts, expires, fullfilled }) {
  const isFullfilled = fullfilled;
  const hasStarted = starts < moment().unix()
  const hasEnded = expires < moment().unix()

  let timerLabel = "expiresLabel";
  let timerLabelText = "Expires";
  let timerTo = expires;
  let timerToText = "..."
  
  // If this campaign has not yet started.
  if (!hasStarted && !isFullfilled) {
      // Change expiration to pending counter.
      timerLabel = "pendingLabel";
      timerLabelText = "Starts";
      timerTo = starts
  }
  
  if (hasStarted && !hasEnded && !isFullfilled) {
      // Change expiration to active campaign counter..
      timerLabel = "expiresLabel";
      timerLabelText = "Expires";
      timerTo = expires
  }

  // If this campaign has already expired.
  if (hasStarted && hasEnded && !isFullfilled) {
      // Change expiration to already expired counter.
      timerLabel = "expiredLabel";
      timerLabelText = "Expired";
      timerTo = expires
  }

  if (isFullfilled) {
      // Change expiration to already expired counter.
      timerLabel = "fullfilledLabel";
      timerLabelText = "Funded";
      timerTo = null;
  }

  if (timerTo) {
    timerToText = moment().to(moment.unix(timerTo))
  }

  return <>
    <div id="timerContainer">
      <div class="valign-wrapper">
        <span>{ timerLabelText } <b>{ timerToText }</b></span>
      </div>
    </div>
  </>
}