import DonationWidget from "../src/components/pages/landing/donations/donation-widget.jsx"
import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'
import moment from 'moment'

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
  title: 'App/Pages/Landing/DonationWidget',
  component: DonationWidget,
};

const Template = (args) => <div style="max-width: 400px;">
  <QueryClientProvider client={queryClient}>
    <section class="sidebar pl-6 my-4 w-50" style="grid-area:sidebar;">
      <DonationWidget {...args} />
    </section>
  </QueryClientProvider>
</div>;

export const NoContributions = Template.bind({});
NoContributions.args = {
  requestedAmount: 2000,
  amountRaised: 0,
  contributionCount: 0,
  expires: moment().add(1, 'day').unix()
}

// More on interaction testing: https://storybook.js.org/docs/preact/writing-tests/interaction-testing
export const SingleContribution = Template.bind({});

SingleContribution.args = {
  requestedAmount: 2000,
  amountRaised: 1000,
  contributionCount: 1,
  expires: moment().add(1, 'day').unix()
}

SingleContribution.play = async ({ canvasElement }) => {
  // const canvas = within(canvasElement);
  // const loginButton = await canvas.getByRole('button', { name: /Log in/i });
  // await userEvent.click(loginButton);
};

export const ExpiredCampaign = Template.bind({});
ExpiredCampaign.args = {
  requestedAmount: 2000,
  amountRaised: 1000,
  contributionCount: 1,
  expires: moment().subtract(1, 'day').unix()
}