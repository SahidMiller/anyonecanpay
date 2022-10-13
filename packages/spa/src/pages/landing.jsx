import CtaButtons from "../components/cta-buttons.jsx"
import Summary from "../components/summary.jsx"
import DonationWidget from "../components/donation-widget.jsx"
import RecipientList from "../components/recipient-list.jsx"
import ContributionList from "../components/contribution-list.jsx"
import Navigation from "../components/campaign-navigation.jsx";
import Modal from "../components/modal.jsx"
import Share from "../components/share.jsx"
import PrimaryButton from "../components/inputs/primary-button.jsx"
import FloatingLabel from "../components/inputs/floating-label.jsx"

import parseMarkdown from "../utils/markdown.js"
import { useEffect, useState, useMemo, useContext, useRef, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import useCopy from "../hooks/useCopy.js"
import { route } from "preact-router"

import { useContributionsQuery } from "../hooks/useContributionQueries.js"
import moment from "moment"

import createDOMPurify from 'dompurify';
const DOMPurify = createDOMPurify(window);

export default function App({ campaign = {}, isDraft = false }) {

  if (!campaign) campaign = { recipients: [] }

  const title = campaign.title;
  const recipients = campaign?.recipients || [];
  const heroImage = campaign.image || (recipients && recipients.length && recipients[0].image)
  const notExpired = campaign.expires && campaign.expires > moment.unix();

  const requestedAmount = useMemo(() => {
    return campaign.recipients.reduce((sum, recipient) => {
      return sum + recipient.satoshis;
    }, 0);
  }, [campaign.recipients])
  
  const shareData = useMemo(() => {
    return {
      text: campaign.description,
      url: window.location.href,
      title: campaign.title
    }
  }, [campaign?.title, campaign?.description, window.location.href]);
  
  const contributionsQuery = useContributionsQuery({
    enabled: !isDraft
  });
  const { totalRaised:amountRaised = 0, contributions = [], fullfillmentTimestamp } = contributionsQuery.data || {};
  const contributionCount = contributions.length; 

  const [description, setDescription] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [copyLink, shareCopySuccess] = useCopy(window.location.href);
  const [scrollHeight, setScrollHeight] = useState(0);
  
  // Use object destructing, so you don't need to remember the exact order
  const donateWidgetRef = useRef();
  const [donateWidgetInViewRef, donateWidgetIsInView ] = useInView({ initialInView: true });

  // Use `useCallback` so we don't recreate the function on each render - Could result in infinite loop
  const donateWidgetInViewRefs = useCallback(
    (node) => {
      // Ref's from useRef needs to have the node assigned to `current`
      donateWidgetRef.current = node;
      // Callback refs, like the one from `useInView`, is a function that takes the node as an argument
      donateWidgetInViewRef(node);
    },
    [donateWidgetInViewRef],
  );

  useEffect(async () => {
    const description = DOMPurify.sanitize(await parseMarkdown(campaign.description));
    setDescription(description);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      setScrollHeight(window.scrollY);
    });
  }, [])

  const isAboveButtons = (donateWidgetRef.current && donateWidgetRef.current.scrollHeight > scrollHeight)
  const showStickyCta = !donateWidgetIsInView && !isAboveButtons;

  function onPledge() {
    route("/donate");
  }

  function onShare() {
    setShowShare(true);
  }

  return <>
    <div className="mt-[65px]">
      {/* <!-- Site content --> */}
      <main class="px-3 sm:px-4 lg:py-8 lg:px-16 m-auto rounded-2xl">
        {/* <!-- Campaign --> */}
        <article id="campaign" class="">
          <div class="main-content bg-transparent sm:py-8" style="grid-area:hero;">
            <div class="bg-gray-200 relative rounded-xl" style="padding-top:56%;">
              <div class="hero-image absolute w-full h-full rounded-xl inset-0 bg-cover bg-center bg-no-repeat" style={heroImage ? `background-image:url(${heroImage})` : ''}></div>
            </div>
          </div>
          <div class="main-content title mt-5" style="grid-area:title;">
            <h5 class="text-3xl font-bold">{ title }</h5>  
          </div>

          {/* <!-- Campaign overview --> */}
          <section class="sidebar pl-6 my-4" style="grid-area:sidebar;">
            <DonationWidget
              ref={donateWidgetInViewRefs}
              requestedAmount={requestedAmount}
              amountRaised={amountRaised}
              contributionCount={contributionCount}
              onPledge={onPledge}
              onShare={onShare}
              expires={campaign.expires}
              fullfillmentTimestamp={fullfillmentTimestamp}
              className="!top-[100px]"
            ></DonationWidget>
          </section>
          
          <div class="sm:px-4 min-w-full" style="grid-area: content;">
            {
              !!recipients.length && <div class="hidden lg:flex mb-6 flex-nowrap gap-3 justify-between border border-x-0 p-2 sm:p-4 border-gray-300" style="" /*dangerouslySetInnerHTML={{__html: userLink}}*/>
                <div><span>This fundraiser is organized by&nbsp;<a href={recipients?.[0]?.url} target="_blank"><span><b>{recipients?.[0]?.name}</b></span></a></span></div>
              </div>
            }

            {/* <!-- Campaign heading --> */}
            <div>
              <Summary description={description}></Summary>
            </div>

            {/* <!-- CTA Links --> */}
            <div class="my-8">
            { !!notExpired && <CtaButtons forceRow={true} onPledge={onPledge} onShare={onShare}></CtaButtons> }
            </div>

            <div class="border border-x-0 p-4 py-8 border-gray-300">
              <RecipientList recipients={recipients}></RecipientList>
            </div>

            <div class="p-4 py-8">
              <ContributionList isFetching={contributionsQuery.isFetching} goal={requestedAmount} contributions={contributions} refetch={isDraft ? () => {} : contributionsQuery.refetch}></ContributionList>
            </div>
          </div>
        </article>
      </main>
    </div>
    
    {
      showShare && <Modal
        heading="Help by raising awareness."
        subheading="Fundraisers shared on social networks raise up to 5x more"
        footer={
          <div className="absolute right-4 top-3 cursor-pointer select-none" onClick={() => setShowShare(false)}>✕</div>
        }
      >
        <div>
          <Share data={shareData}>
            <button>Share</button>
          </Share>
        </div>
        <div class="flex justify-betwwen gap-4 mt-4">
          <div class="w-full flex relative border rounded m-1 text-gray-500 px-4" onClick={() => copyLink()}>
            <input readonly class="w-full text-black outline-0" id="alias" type="text" name="alias" placeholder="&nbsp;" value={window.location.href} onClick={() => copyLink()}></input>
            <FloatingLabel className="absolute top-1 left-4 -translate-y-3.5 bg-white text-black text-sm" onClick={() => copyLink()}>Copy link</FloatingLabel>
          </div>
          <PrimaryButton onClick={() => copyLink()}>Copy</PrimaryButton>
        </div>
        <div className={`${!shareCopySuccess ? 'invisible' : ''} ml-6 text-green-400`}>✓ Copied!</div>
      </Modal>
    }

    {/* <!-- CTA Links --> */}
    { !!notExpired && <div class="order-first sticky top-0 z-20">
      <div class="absolute bg-white border-b top-0 left-0 right-0 p-4 w-full shadow-lg transition-all ease-in-out duration-200 opacity-0 -translate-y-full" style={`${ showStickyCta ? "opacity:100%; transform:translateY(0);" : "" }`}>
        <CtaButtons onPledge={onPledge} onShare={onShare} forceRow={true}></CtaButtons>
      </div>
    </div> }
  </>
}