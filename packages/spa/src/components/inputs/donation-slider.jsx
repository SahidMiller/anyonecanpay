import classNames from "classnames";
import LoadingIndicator from "../loading-indicator.jsx"
import prettyPrintSats from "../../utils/prettyPrintSats.js";

export default function DonationForm({ donationAmount = 0, maximumAmount = 0, setDonationAmount, onPledge, disablePledge }) {

  const isLoading = false;

  const donateFieldClasses = classNames({
    'hidden': isLoading
  });

  
  const donatePercentage = maximumAmount > 0 ? 
    Number(Number((donationAmount / maximumAmount) * 100).toFixed(2)) : 
    0
    
  function onDonateSliderChange(e) {
    const nextPercentage = Number(e.target.value) / 100;
    const nextAmount = (maximumAmount * nextPercentage).toFixed(0);
    setDonationAmount(Number(nextAmount));
  }

  const isFullfilling = donatePercentage === 100;
  const donateText = isFullfilling ? "Fullfill" : "Pledge";
  
  const donationAmountClasses = classNames({
    hidden: isFullfilling
  });
  
  const [donateAmountText, donationAmountDenominationText] = prettyPrintSats(donationAmount);

  const enablePledge = !disablePledge && donatePercentage > 0;
  

  function onPledgeClick(e) {
    e.preventDefault();
    onPledge(donationAmount)
  }

  return <>
    <fieldset id="donateField" class="row">
      <div id="donateFormContainer">
        <div id="donateForm" className={`col s12 m12 l12 ${donateFieldClasses}`}>
          <div class="input-field col s1 m1 l1">
            <i class="icon-attach_money money-icon"></i>
          </div>
          <div id="donationSliderContainer" class="input-field col s11 m5 l6">
            <input type="range" min="0" max="100" value={donatePercentage} onChange={onDonateSliderChange} step="0.20" class="slider" id="donationSlider"></input>
          </div>
          <div id="donationButtonContainer" class="input-field col s12 m6 l5">
            <button id="donateButton" class="btn waves-effect waves-light green" disabled={!enablePledge} onClick={onPledgeClick}>
              <span id="donateText" data-string="donateText">{donateText}</span> <span id="donationAmount" className={donationAmountClasses}>{donateAmountText} {donationAmountDenominationText}</span>
            </button>
          </div>
        </div>
        <div id="donateFormLoadingContainer" style="position: relative;">
          <div id="donateStatus" class="col s12 m12 l12 v-hidden"></div>
          { isLoading && <LoadingIndicator></LoadingIndicator> }
        </div>
      </div>
    </fieldset>
  </>
}