import App from "../src/app.jsx"
import { WalletProvider } from "../providers/wallet-provider.jsx";
import { FundraiserProvider } from "../providers/fundraiser-provider.jsx"
import { IpfsProvider } from "../providers/ipfs-provider.jsx";
import campaignJson from "../public/campaign.json"

import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      cacheTime: Infinity,
      retry: false
    },
  },
});

export default {
  title: 'App/Full',
  component: App,
};

const seedPhrase = 'bicycle demise goddess review true initial field agree oblige combine fame maximum';
const ipfs = {}

const Template = (args) => {

  return <>
    <div>
      <QueryClientProvider client={queryClient}>
        <IpfsProvider ipfs={ipfs}>
          <WalletProvider seedPhrase={seedPhrase}>
            <FundraiserProvider campaign={args.campaign}>
              <App {...args} />
            </FundraiserProvider>
          </WalletProvider>
        </IpfsProvider>
      </QueryClientProvider>
    </div>
  </>;
}

export const WithoutImage = Template.bind({});
WithoutImage.args = {
  campaign: campaignJson
}

export const WithSmallImage = Template.bind({});
WithSmallImage.args = {
  campaign: {
    ...campaignJson,
    image: "https://navbar.cloud.bitcoin.com/images/logo_black.png",
    recipients: [
      { 
        ...campaignJson.recipients[0], 
        image: "https://navbar.cloud.bitcoin.com/images/logo_black.png"
      },
      ...(campaignJson.recipients.slice(1))
    ],
  }  
}

export const WithLargeImage = Template.bind({});

const campaginWithLargeImage = {
  ...campaignJson,
  image: "https://flipstarter.paytaca.com/images/paytaca-app-header.png",
  recipients: [
    { 
      ...campaignJson.recipients[0], 
      image: "https://flipstarter.paytaca.com/images/paytaca-app-header.png"
    },
    ...(campaignJson.recipients.slice(1))
  ],
}

WithLargeImage.args = {
  campaign: campaginWithLargeImage
}

export const WithContributions = Template.bind({});
WithContributions.args = {
  campaign: campaginWithLargeImage,
  contributions: [{ 
    data: { 
      alias: "Tester 1", 
      comment: "This is a test comment" 
    }, 
    satoshis: 1000000, 
    cid: "" 
  }, { 
    data: { 
      alias: "Tester 2", 
      comment: "This is a second comment" 
    }, 
    satoshis: 1000, 
    cid: "" 
  }]
}