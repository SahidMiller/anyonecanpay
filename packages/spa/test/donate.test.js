import "regenerator-runtime"
import { render, screen, fireEvent, waitFor } from "@testing-library/preact"
import { h } from 'preact';
import globalJsdom from "global-jsdom"
import {ContributionProvider} from "../src/components/withContributions.js"
import DonatePage from "../src/pages/donate.jsx"
import { QueryClientProvider, QueryClient } from "react-query"
import userEvent from '@testing-library/user-event';

beforeEach(() => {
  global.cleanup = globalJsdom()
})

afterEach(() => {
  global.cleanup()
})

jest.mock('react-query', () => ({
  useQueryClient: jest.fn(),
  useQueries: jest.fn()
}));

jest.mock('../src/utils/currencyRates.js', () => {
  return () => ([
    { code: "USD", rate: 200 },
    { code: "BCH", rate: 1 }
  ])
})

jest.mock('../src/components/withContributions.js', () => ({
  useContributions: jest.fn(() => {
    return { contributions: [], isFullfilled: false }
  })
}));

test('shows error when blurred without donation amount', async () => {

  const mockElectrum = {};

  const campaign = { 
    recipients: [], 
    descriptions: { 
      en: {
        abstract: "",
        proposal: ""
      }
    } 
  };

  const { getByTestId, getByRole, getByText, getAllByTestId } = render(
    <DonatePage campaign={campaign}/>
  );

  expect(() => getByTestId("donationAmountError")).toThrow();

  const donationInput = getByTestId("donationInput");
  
  donationInput.focus();
  donationInput.blur();
  
  await waitFor(() => {
    const error = getByTestId("donationAmountError");
    expect(error).toBeDefined();
    expect(error.textContent).toBe("Please enter a donation amount");
  });

  const continueButton = getByRole("button", { name: "Continue"});
  userEvent.click(continueButton);
  
  expect(() => getByText("Payment method")).toThrow();

  userEvent.click(continueButton);

  await waitFor(() => {
    const paymentMethod = getByText("Payment method");
    expect(paymentMethod).toBeDefined();
  });

  expect(getAllByTestId("donationAmountText")[0].textContent).toBe("0 SATS");
  expect(getAllByTestId("tipAmountText")[0].textContent).toBe("0 SATS");
  expect(getAllByTestId("totalAmountText")[0].textContent).toBe("0 SATS");
});

test('shows error when continuing without donation amount', async () => {

  const mockElectrum = {};

  const campaign = { 
    recipients: [], 
    descriptions: { 
      en: {
        abstract: "",
        proposal: ""
      }
    } 
  };

  const { getByTestId, getByRole, getByText, getAllByTestId } = render(
    <DonatePage campaign={campaign}/>
  );

  expect(() => getByTestId("donationAmountError")).toThrow();
  
  const continueButton = getByRole("button", { name: "Continue"});
  userEvent.click(continueButton);

  await waitFor(() => {
    const error = getByTestId("donationAmountError");
    expect(error).toBeDefined();
    expect(error.textContent).toBe("Please enter a donation amount");
  });
  
  expect(() => getByText("Payment method")).toThrow();

  userEvent.click(continueButton);

  await waitFor(() => {
    const paymentMethod = getByText("Payment method");
    expect(paymentMethod).toBeDefined();
  });

  expect(getAllByTestId("donationAmountText")[0].textContent).toBe("0 SATS");
  expect(getAllByTestId("tipAmountText")[0].textContent).toBe("0 SATS");
  expect(getAllByTestId("totalAmountText")[0].textContent).toBe("0 SATS");
});

test('shows error when blurred without donation amount more than asking', async () => {

  const mockElectrum = {};

  const campaign = { 
    recipients: [], 
    descriptions: { 
      en: {
        abstract: "",
        proposal: ""
      }
    } 
  };

  const { getByTestId, getByRole, getByText, getAllByTestId } = render(
    <DonatePage campaign={campaign}/>
  );

  expect(() => getByTestId("donationAmountError")).toThrow();

  const donationInput = getByTestId("donationInput");
  
  donationInput.focus();
  userEvent.type(donationInput, ".00001000");
  donationInput.blur();
  
  await waitFor(() => {
    const error = getByTestId("donationAmountError");
    expect(error).toBeDefined();
    expect(error.textContent).toBe("This donation exceeds what the campaign needs (0 SATS)");
  });

  const continueButton = getByRole("button", { name: "Continue"});
  userEvent.click(continueButton);
  
  expect(() => getByText("Payment method")).toThrow();

  userEvent.click(continueButton);
  await waitFor(() => {
    const paymentMethod = getByText("Payment method");
    expect(paymentMethod).toBeDefined();
  });

  expect(getAllByTestId("donationAmountText")[0].textContent).toBe("1000 SATS");
  expect(getAllByTestId("tipAmountText")[0].textContent).toBe("546 SATS");
  expect(getAllByTestId("totalAmountText")[0].textContent).toBe("1546 SATS");
});

test('shows error when blurred without less than MIN_SATOSHIS', async () => {

  const mockElectrum = {};

  const campaign = { 
    recipients: [], 
    descriptions: { 
      en: {
        abstract: "",
        proposal: ""
      }
    } 
  };

  const { getByTestId, getByRole, getByText, getAllByTestId } = render(
    <DonatePage campaign={campaign}/>
  );

  expect(() => getByTestId("donationAmountError")).toThrow();

  const donationInput = getByTestId("donationInput");
  
  donationInput.focus();
  userEvent.type(donationInput, ".00000545");
  donationInput.blur();
  
  await waitFor(() => {
    const error = getByTestId("donationAmountError");
    expect(error).toBeDefined();
    expect(error.textContent).toBe("Minimum donation amount is 546 SATS");
  });

  const continueButton = getByRole("button", { name: "Continue"});
  userEvent.click(continueButton);
  
  expect(() => getByText("Payment method")).toThrow();

  userEvent.click(continueButton);
  await waitFor(() => {
    const paymentMethod = getByText("Payment method");
    expect(paymentMethod).toBeDefined();
  });

  expect(getAllByTestId("donationAmountText")[0].textContent).toBe("545 SATS");
  expect(getAllByTestId("tipAmountText")[0].textContent).toBe("546 SATS");
  expect(getAllByTestId("totalAmountText")[0].textContent).toBe("1091 SATS");
});