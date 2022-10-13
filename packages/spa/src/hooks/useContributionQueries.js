import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { contributionQueryKeys } from "../queries/contributions.js";
import { useFundraiser } from "./useFundraiser.js";
import { feesFor } from "@ipfs-flipstarter/utils/helpers";

export function useRefreshContributionQueries() {
  const queryClient = useQueryClient();
  const { recipients = [] } = useFundraiser() || {};

  return useCallback(async () => {
    await queryClient.cancelQueries(contributionQueryKeys.getContributions(recipients));
    await queryClient.cancelQueries(contributionQueryKeys.getNotificationTxs(recipients));
    await queryClient.invalidateQueries(contributionQueryKeys.getContributions(recipients));
    await queryClient.invalidateQueries(contributionQueryKeys.getNotificationTxs(recipients));
    await queryClient.fetchQuery(contributionQueryKeys.getContributions(recipients));
  }, [recipients]);
}

export function useContributionsQuery(queryOptions) {
  const { recipients = [] } = useFundraiser() || {};

  return useQuery(contributionQueryKeys.getContributions(recipients), {
    staleTime: 30000,
    cacheTime: 30000,
    refetchInterval: 30000,
    enabled: !!recipients && (typeof queryOptions?.enabled === 'undefined' || queryOptions.enabled),
    placeholderData: {
      contributions: [],
      isFullfilled: false,
      totalRaised: 0,
      fullfillmentFees: feesFor(1, recipients.length)
    }
  });
}

export default useContributionsQuery;