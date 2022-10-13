import { contributionQueryKeys } from '../queries/contributions.js';
import { useQuery } from 'react-query';

const defaultReturn = {};
export default function useCommitmentDataQuery(contribution) {
  return useQuery(contributionQueryKeys.getApplicationData(contribution), {
    staleTime: 30 * 1000,
  }) || defaultReturn;
}