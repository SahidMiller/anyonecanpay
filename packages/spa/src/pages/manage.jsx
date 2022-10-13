import { useState, useEffect, useCallback } from "react";

import { useIpfs } from "../hooks/useIpfs.js";
import CampaignModal from "../components/campaign-modal.jsx";
import CampaignCard from "../components/campaign-card.jsx";
import FundraiserProvider from "../providers/fundraiser-provider"

import { useLoadFlipstarters } from "../hooks/useLoadFlipstarter.js";

export default function ManagePage({ setIsLoading }) {
  const { ipfs } = useIpfs();
  const [campaigns, setCampaigns] = useState([]);
  const [showCampaign, setShowCampaign] = useState(null); 
  
  const { execute:reloadFlipstarters } = useLoadFlipstarters({
    onFetch() {
      // setIsLoading(true);
    },
    onSuccess(campaigns) {
      setCampaigns(campaigns);
    },
    onError(err) {
      // console.log(err);
    },
    onSettled() {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (ipfs && showCampaign) {
      ipfs.connectToPreloadNodes(showCampaign.preloadNodes);
    }
  }, [ipfs, showCampaign]);

  const openContribtionsModal = useCallback((campaign) => {
    setShowCampaign(campaign);
  }, []);

  const closeContributionModal = useCallback(async (refetch) => {
    setShowCampaign(null);

    if (refetch === true) {
      reloadFlipstarters();
    }
  }, [reloadFlipstarters]);

  return <div id="main" className="relative min-h-screen">
    <div>
      <div id="listCampaigns">
        <div id="campaigns" class="">
          { !campaigns.length ? <div class="absolute inset-0 flex justify-center items-center opacity-50">
            <div>
              <div class="text-center">
                  <div class="mt-3">
                      <h2 class="text-3xl mb-2">No campaigns</h2>
                      <em><a class="text-blue-500 cursor-pointer" href="#/">Create one here!</a></em>
                  </div>
              </div>
            </div>
          </div> : <div>
              <div class="mb-8">
                  <div class="text-center">
                      <div class="mt-3 mb-5">
                          <h2 class="text-3xl mb-2">Created campaigns</h2>
                      </div>
                  </div>
              </div>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {campaigns.map((campaign) =>
                  <FundraiserProvider key={campaign.parent} campaign={campaign}>
                    <div>
                      <CampaignCard campaign={campaign} onOpen={openContribtionsModal}></CampaignCard>
                    </div>
                  </FundraiserProvider>
                )}
              </div>
          </div> }
        {
          showCampaign ? <FundraiserProvider key={showCampaign.id} campaign={showCampaign}>
            <CampaignModal campaign={showCampaign} onClose={closeContributionModal}></CampaignModal>
          </FundraiserProvider> : <></>
        }
        </div>
      </div>
    </div>
  </div>
}