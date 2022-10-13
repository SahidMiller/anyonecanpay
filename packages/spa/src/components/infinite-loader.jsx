

import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";
import { FixedSizeGrid } from "react-window";
import { useCallback } from "react";
import { get } from "idb-keyval";

import campaignStore from "../utils/campaignStore.js";
import useMemoizedQueries from "../hooks/useMemoizedQueries.js"
import CampaignCard from "../components/campaign-card.jsx";
import FundraiserProvider from "../providers/fundraiser-provider"

function CampaignCardCell({ columnIndex, rowIndex, style, data, openContribtionsModal }) {
  const campaignQuery = data[(rowIndex * 2) + columnIndex];
  const campaign = campaignQuery?.data;

  return <FundraiserProvider key={campaign.id} campaign={campaign}>
    <div style={{...style, padding: '15px'}} >
      <CampaignCard campaign={campaign} onOpen={openContribtionsModal}></CampaignCard>
    </div>
  </FundraiserProvider>
}

function decorateForGrid(onItemsRendered) {
  return ({
    overscanColumnStartIndex,
    overscanColumnStopIndex,
    overscanRowStartIndex,
    overscanRowStopIndex,
    visibleColumnStartIndex,
    visibleColumnStopIndex,
    visibleRowStartIndex,
    visibleRowStopIndex,
  }) => {
    return onItemsRendered({
      overscanStartIndex: (overscanRowStartIndex * 2) + overscanColumnStartIndex,
      overscanStopIndex: (overscanRowStopIndex * 2) + overscanColumnStopIndex,
      visibleStartIndex: (visibleRowStartIndex * 2) + visibleColumnStartIndex,
      visibleStopIndex: (visibleRowStopIndex * 2) + visibleColumnStopIndex
    });
  }
}

export function InfinteLoadingCampaignCards({ savedCampaignIds, openContribtionsModal }) {
  const queryClient = useQueryClient();
  
  const campaignQueries = useMemoizedQueries({
    queries: savedCampaignIds.map((id) => {
      return {
        queryKey: ['getCampaign', id],
        queryFn: () => get(id, campaignStore),
      }
    })
  });

  const isItemLoaded = useCallback((index) => {
    const query = campaignQueries[index];
    return query?.isFetched;
  }, [campaignQueries]);
  
  const loadMoreItems = useCallback((startIndex, stopIndex) => {
    const ids = savedCampaignIds.slice(startIndex, stopIndex);
    
    return Promise.all(ids.map(id => queryClient.fetchQuery(['getCampaign', id], () => {
      return get(id, campaignStore)
    }).catch(err => { debugger })));

  }, [savedCampaignIds]);

  return <InfiniteLoader
    isItemLoaded={isItemLoaded}
    itemCount={savedCampaignIds.length}
    loadMoreItems={loadMoreItems}
  >
    {({ onItemsRendered, ref }) => (
      <AutoSizer>
        {({ height, width }) => 
          <FixedSizeGrid 
            // className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
            itemData={campaignQueries}
            className="campaign-card-grid"
            onItemsRendered={decorateForGrid(onItemsRendered)}
            ref={ref}
            itemCount={campaignQueries.length}
            height={height}
            width={width}
            style={{justifyContent:'center', display:'flex'}}
            columnCount={2}
            columnWidth={400}
            rowCount={campaignQueries.length / 2}
            rowHeight={400}
            itemKey={({ data, rowIndex, columnIndex }) => data[(rowIndex * 2) + columnIndex]?.id}
          >
            {(props) => CampaignCardCell({ ...props, openContribtionsModal })}
          </FixedSizeGrid>
        }
      </AutoSizer>
    )}
  </InfiniteLoader>
}