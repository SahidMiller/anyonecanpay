import "regenerator-runtime"
import { render, screen, fireEvent, waitFor } from "@testing-library/preact"
import { h } from 'preact';
import globalJsdom from "global-jsdom"
import {ContributionProvider} from "../src/components/withContributions.js"
import DonatePage from "../src/pages/donate.jsx"
import { QueryClientProvider, QueryClient } from "react-query"
import userEvent from '@testing-library/user-event';
import { WalletContext, WalletProvider } from "../providers/wallet-provider.jsx";
import { feesFor } from "@ipfs-flipstarter/utils/wallet/index.js";

const notificationFee = 958;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      cacheTime: Infinity,
      retry: false
    },
  },
});

beforeEach(() => {
  global.cleanup = globalJsdom()
})

afterEach(() => {
  global.cleanup()
})

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

jest.mock('../src/utils/frozen-coins.js', () => ({
  freezeUtxo: jest.fn(),
  getFrozenUtxos: jest.fn(async () => ([]))
}))

test('shows error when blurred without donation amount', async () => {
  jest.setTimeout(300000);

  const utxos = [{ 
    value: 5000,
    tx_hash: "e1de47b280f39322127f1e799675ccbb128dc89d0fe57b1fb50d432d02429fd9",
    tx_pos: 0
  }];

  const mockElectrum = {
    ready: jest.fn(),
    subscribe: jest.fn(),
    request: jest.fn((request, ...args) => {
      if (request === "blockchain.scripthash.listunspent") {
        return utxos;
      }

      if (request ===  "blockchain.transaction.broadcast" && args[0] === "0200000001d99f42022d430db51f7be50f9dc88d12bbcc7596791e7f122293f380b247dee10000000064418b92bfa0b5e7cb1252fcf89ac262f2bb0c8dd5d781cddbf70a1de3acfa7acaee770cd3cddafac8e7c695a5d8c2290c8e9b69da0c25980ad71821652d602d2c80412102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31bffffffff03e8030000000000001976a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788acbe030000000000001976a91467e0274bee0dd89a54b5e0b8e6972dcdd9c8822788ac22020000000000001976a91471feb4a3a8bb7895bc8ce9434a3b73476cf2ef9988ac00000000") {
        return "setupTransactionHash"
      }

      if (request ===  "blockchain.transaction.broadcast" && args[0] === "020000000165b461a6f4bc457371f6863e6730a23ab152e0f4c393bf79cb8a96cdc3ab41d501000000644170b2cd7475dbd66e8ea577e2abde5bbbe36b2e4a26ab6953ee74034aa7c0b67ad832285ac82e5aa0227f2a6302a5aadd6ddf2cc5a28fbc689e0302740dc2ae52412102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31bffffffff0222020000000000001976a91433f04bfff1b189ce721b04f8ec2740882a23ee6088ac0000000000000000b86a4cb5d541abc3cd968acb79bf93c3f4e052b13aa230673e86f6717345bcf4a661b46500000000ffffffff00000000000000000000000000000000000000000000000000000000000000000000483045022100c2e7db73748a8e69ed5531bfeb3582bef03beb079ab017cb2cf66d5f2177aa2202201b685b740cb48af7c269d3b3408503cf451b48c72a3f45a8b2f6319f563f7bf9c12102e56c8e9f6b00816964840e7bbbb337f069d6084a23e2b7834cfa0946395ab31b00000000") {
        return "notificationTransactionHash"
      }

      debugger;
    })
  };

  const campaign = { 
    recipients: [{ 
      satoshis: 2000,
      address: "bitcoincash:qqelqjll7xccnnnjrvz03mp8gzyz5glwvqflkj957v",
    }], 
    descriptions: { 
      en: {
        abstract: "",
        proposal: ""
      }
    } 
  };
  debugger

  const seedPhrase = 'bicycle demise goddess review true initial field agree oblige combine fame maximum';

  const { getByTestId, getByRole, getByText, getAllByTestId } = render(
    <QueryClientProvider client={queryClient}>
      <WalletProvider seedPhrase={seedPhrase} electrum={mockElectrum}>
        <DonatePage campaign={campaign}/>
      </WalletProvider>
    </QueryClientProvider>
  );

  const donationInput = getByTestId("donationInput");
  
  donationInput.focus();
  userEvent.type(donationInput, ".00001");
  donationInput.blur();

  const continueButton = getByRole("button", { name: "Continue"});  
  userEvent.click(continueButton);
  userEvent.click(continueButton);

  await waitFor(() => {
    const paymentMethod = getByText("Payment method");
    expect(paymentMethod).toBeDefined();
  });

  const integratedWalletButton = getByText("Integrated wallet");
  userEvent.click(integratedWalletButton);

  await waitFor(() => getByText("Reveal seed"));
  
  const revealSeedButton = getByText("Reveal seed");
  userEvent.click(revealSeedButton);

  await waitFor(() => getByText("Done"));
  const doneButton = getByText("Done");
  userEvent.click(doneButton);

  const donateNowButton = getByText("Donate now");
  userEvent.click(donateNowButton);

  await waitFor(() => getByText("Ready for checkout?"));

  //Default tip amount = 546
  await waitFor(() => {
    expect(getByTestId("checkoutAvailableAmount").textContent).toBe("5000 SATS")
    expect(getByTestId("checkoutTotalAmount").textContent).toBe("1546 SATS")
    expect(getByTestId("checkoutAvailableAmount").textContent).toBe("5000 SATS")
    
    //Single coin to three outputs (setup and notification and tip)
    const expectedConsolidationFee = feesFor(1, 3);
    const expectedFees = notificationFee + expectedConsolidationFee;
    expect(getByTestId("checkoutNetworkFeesAmount").textContent).toBe(`${expectedFees} SATS`)
    expect(getByTestId("checkoutRequestingAmount").textContent).toBe("0 SATS")
  }, {
    timeout: 5000
  });
  
  await waitFor(() => expect(getByTestId("pledgeButton").disabled).toBeFalsy(), {
    timeout: 5000
  });
  
  const pledgeButton = getByText("Pledge");
  userEvent.click(pledgeButton);
});