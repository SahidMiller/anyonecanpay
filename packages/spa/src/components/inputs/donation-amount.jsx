import CurrencyInput, {formatValue} from "@sahidmiller/react-currency-input-field"
import styled from "styled-components"
import { useState, useEffect, useRef, useMemo } from "react";
import fetchCurrencyRates from "../../utils/currencyRates.js";
import { forwardRef } from "react";

import prettyPrintSats from "../../utils/prettyPrintSats.js";
import { MIN_SATOSHIS, SATS_PER_BCH } from "../../utils/bitcoinCashUtilities.js";
import StyledRange from "./styled-range.jsx"

const StyledCurrencyInput = styled(CurrencyInput).attrs({
  className: "w-full outline-0 text-lg xs:text-2xl sm:text-3xl font-bold text-right",
  inputmode: "decimal",
  autocomplete: "off"
})``;

function getCurrencyTypes(currencyRates) {
  const currencyTypes = [
    { 
      ticker: "BCH",
      icon: "icon-bch",
      config: {
        decimalsLimit: 8,
        decimalScale: 8,
      }
    }
  ];

  if (currencyRates.find(c => c.code === "USD")) {
    currencyTypes.push({
      ticker: "USD",
      icon: "icon-usd",
      config: {
        decimalScale: 4,
        intlConfig: { locale: 'en-US', currency: "USD" },
        prefix: " "
      }
    })
  }

  return currencyTypes;
}

export default function DonationAmount({ defaultDonationAmount, walletBalance, donationInputType = "default", onDonationAmountChanged, defaultValue = 0, defaultCurrency = "BCH", current, goal, donationAmountError, ...props }) {

  let max = 0;
  if (current < goal) {
    const remainingAmount = goal - current;
    max = remainingAmount < MIN_SATOSHIS ? MIN_SATOSHIS : remainingAmount
  }

  const defaultCurrencyValue = defaultDonationAmount ? defaultDonationAmount / SATS_PER_BCH : ""

  const [donationCurrencyValue, setDonationCurrencyValue] = useState(defaultCurrencyValue);
  const [donationAmount, setDonationAmount] = useState(defaultDonationAmount);
  const [selectedCurrencyType, setSelectedCurrencyType] = useState(defaultCurrency);
  
  const [currencyRates, setCurrencyRates] = useState([]);

  const currencyTypes = getCurrencyTypes(currencyRates);
  const selectedCurrency = currencyTypes.find(c => c.ticker === selectedCurrencyType);
  const currencyConfig = selectedCurrency.config || {}
  
  const [donationAmountText, donationAmountDenomination] = prettyPrintSats(donationAmount);
  
  const usdRate = useMemo(() => {
    return currencyRates?.find(c => c.code === "USD")?.rate || 0;
  }, [currencyRates]);
  
  const altDonationAmountText = useMemo(() => {
    if (selectedCurrencyType === "BCH") {
      const fiatAmount = usdRate * (donationAmount / SATS_PER_BCH)
      return Math.round(fiatAmount * 100) / 100;
    } else {
      return donationAmountText;
    }
  }, [usdRate, donationAmount, selectedCurrencyType]);

  const altDonationAmountDenomination = selectedCurrencyType === "BCH" ? "USD" : donationAmountDenomination;

  const rangeRef = useRef();

  useEffect(async () => {
    const currencyRates = await fetchCurrencyRates();
    setCurrencyRates(currencyRates);
  }, []);

  function onCurrencyChanged(e) {
    //Set text value to donation value in new currency.

    //Convert donation amount to new currency
    const currency = e.target.value;
    const { rate: toCurrencyRate } = currencyRates.find(c => c.code === currency) || {};
    const { config: toCurrencyConfig } = currencyTypes.find(c => c.ticker === currency) || {};
    
    if (toCurrencyRate && toCurrencyConfig) {
      const value = (donationAmount / SATS_PER_BCH) * toCurrencyRate
      setDonationCurrencyValue(formatValue({ value: value.toString(), ...toCurrencyConfig, disableGroupSeparators: true }));
      setSelectedCurrencyType(currency);

    } else {
      return setDonationCurrencyValue(0);
    }
  }

  function onValueChanged(textValue, currencyType) {
    //Convert whatever currency back to BCH
    const value = parseFloat(textValue || 0);
    currencyType = currencyType || selectedCurrencyType;
    
    const { rate: fromCurrencyRate } = currencyRates.find(c => c.code === currencyType) || { rate: 1 };

    if (!isNaN(value) && (currencyType === "SATS" || currencyType === "SAT" || fromCurrencyRate)) {
      //Notify new SATS value.
      const sats = currencyType === "SATS" || currencyType === "SAT" ? value : Math.round((value / fromCurrencyRate) * SATS_PER_BCH);
      onDonationAmountChanged(sats);
      setDonationAmount(sats);

      if (currencyType !== selectedCurrencyType && !isNaN(value)) {
        const { rate: toCurrencyRate } = currencyRates.find(c => c.code === selectedCurrencyType) || { rate: 1 };
        const { config: toCurrencyConfig } = currencyTypes.find(c => c.ticker === selectedCurrencyType) || {};
  
        if (toCurrencyRate && toCurrencyConfig) {
          const displayValue = (sats / SATS_PER_BCH) * toCurrencyRate;
          setDonationCurrencyValue(formatValue({ value: displayValue.toString(), ...toCurrencyConfig, disableGroupSeparators: true }));
        }

        return
      }
    }
    
    setDonationCurrencyValue(textValue);
  }

  function setMaximumAmount() {
    const { rate: toCurrencyRate } = currencyRates.find(c => c.code === selectedCurrencyType) || { rate: 1 };
    const value = (max / SATS_PER_BCH) * toCurrencyRate;
    onValueChanged(value);

    if (rangeRef.current) {
      rangeRef.current.value = "100"
    }
  }
  
  //Use current + donation rather than setting "left" property to completedPercentage.
  let contributionPercentage = Math.floor(((donationAmount + current) / goal) * 100);
  let completedPercentage = Math.floor(((current) / goal) * 100);

  if (contributionPercentage < 0) contributionPercentage = 0;
  if (completedPercentage < 0) completedPercentage = 0;

  if (contributionPercentage > 100) contributionPercentage = 100;
  if (completedPercentage > 100) completedPercentage = 100;

  return <div>
    <div class="gap-x-2 gap-y-0.5 grid grid-cols-4 items-center">
      <div class="col-span-3 relative">
        { donationInputType === "default" && <div class='flex border border-2 border-gray-300 rounded py-3 px-4 w-full focus-within:outline'>
          <div class="relative mr-4 group">
            <select 
              name="currency" 
              class="absolute w-full h-full bottom-0 left-0 appearance-none opacity-0" 
              value={selectedCurrency.ticker}
              onChange={onCurrencyChanged}>
              <option value="BCH">BCH</option>
              <option value="USD">USD</option>
            </select>
            <div class="text-center pointer-events-none">
              <span class={`block ${selectedCurrency.icon || ""}`}></span>
              <span class="block font-bold">{selectedCurrency.ticker}</span>
              <span class="block font-bold down-arrow"></span>

            </div>
          </div>
          <StyledCurrencyInput data-testid="donationInput" 
            value={donationCurrencyValue} 
            name="donationAmount" 
            id="donationAmount" 
            {...currencyConfig} 
            {...props}
            onValueChange={(value) => onValueChanged(value)}>
          </StyledCurrencyInput>
        </div> }
        
        { donationInputType === "slider" && <>
          <div class="relative">
            <div class="absolute h-2 bg-green-200 rounded z-10" style={`width:${contributionPercentage}%;`}></div>
            <div class="absolute h-2 bg-green-500 rounded z-10" style={`width:${completedPercentage}%;`}></div>
            <StyledRange ref={rangeRef} className="h-2 absolute" defaultValue={contributionPercentage} onChange={(e) => {
              const percentage = Number(e.target.value) / 100;
              let amount = Math.round(percentage * goal) - current;
              amount = amount > 0 ? amount : 0;
              
              const { rate: toCurrencyRate } = currencyRates.find(c => c.code === selectedCurrencyType) || { rate: 1 };
              const value = (amount / SATS_PER_BCH) * toCurrencyRate;

              onValueChanged(value);
            }}></StyledRange>
          </div>
        </> }
      </div>
      <div class="text-center">
        <div class="flex p-2 place-content-center rounded h-20">
          <button class="bg-green-400 rounded text-white w-full cursor-pointer disabled:cursor-default disabled:bg-gray-300" onClick={setMaximumAmount}>Max</button>
        </div>
        { !!walletBalance && <div class="flex place-content-center rounded">
          <div class="w-full mx-2 rounded font-extralight border shadow hover:shadow-none cursor-pointer" onClick={() => onValueChanged(walletBalance, "SATS")}>Max in wallet</div>
        </div> }
      </div>
    </div>
    <div class="mt-1">
      <div>
        { donationInputType === "slider" && <div class="text-lg -mt-4"><span>{donationAmountText}</span> {donationAmountDenomination}</div> }
        { !donationAmountError && <div class="font-extralight"><span>{altDonationAmountText}</span> {altDonationAmountDenomination}</div> }
      </div>
      
      { donationAmountError && <div data-testid="donationAmountError" class="flex gap-2 items-center ml-4 my-2 text-red-500"><span class="icon-info"></span><span class="">{donationAmountError}</span></div> }
    </div>
  </div>
}