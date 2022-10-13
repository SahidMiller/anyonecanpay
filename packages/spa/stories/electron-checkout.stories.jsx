import ElectronModal from "../src/components/pages/donation/modals/electron-modal";
import campaignJson from "../public/campaign.json";
import {WalletProvider} from "../providers/wallet-provider.jsx";
import { FundraiserProvider } from "../providers/fundraiser-provider.jsx"
import { IpfsProvider } from "../components/ipfs-provider.jsx";

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

const seedPhrase = 'bicycle demise goddess review true initial field agree oblige combine fame maximum';
const ipfs = {}

export default {
  title: 'App/Pages/Donation/Checkout/Electron',
  component: ElectronModal,
};

const Template = (args) => <div>
  <QueryClientProvider client={queryClient}>
    <IpfsProvider ipfs={ipfs}>
      <WalletProvider seedPhrase={seedPhrase}>
        <FundraiserProvider campaign={args.campaign}>
          <ElectronModal {...args} />
        </FundraiserProvider>
      </WalletProvider>
    </IpfsProvider>
  </QueryClientProvider>
</div>;

export const Initial = Template.bind({});

Initial.args = {
  campaign: {
    ...campaignJson,
    image: "https://flipstarter.paytaca.com/images/paytaca-app-header.png",
  },
  recipients: campaignJson.recipients,
  seedPhrase: 'bicycle demise goddess review true initial field agree oblige combine fame maximum',

}