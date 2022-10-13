import Landing from "../src/pages/landing.jsx"
import { FundraiserProvider } from "../providers/fundraiser-provider.jsx"
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
  title: 'App/Pages/Landing/Full',
  component: Landing,
};

const Template = (args) => <>
  <div>
    <QueryClientProvider client={queryClient}>
      <FundraiserProvider campaign={args.campaign}>
        <Landing {...args} />
      </FundraiserProvider>
    </QueryClientProvider>
  </div>
</>;

export const WithoutImage = Template.bind({});

WithoutImage.args = {
  campaign: campaignJson
}

export const WithSmallImage = Template.bind({});

const campaginWithSmallImage = {
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

WithSmallImage.args = {
  campaign: campaginWithSmallImage
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
    satoshis: 10000000000, 
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