import {memo} from "react"
import pluralize from "../utils/pluralize.js"
import Contribution from "./contribution-item.jsx";

import useFundraiser from "../hooks/useFundraiser";
import { useContributionsQuery } from "../hooks/useContributionQueries";

function ContributionList({ isFetching, contributions, goal, refetch }) {
  
  const contributionCount = contributions.length;

  return <div class="contribution-list text-lg">
    <div class="text-sm mb-8 flex justify-between">
      <div>
        <h1 class="text-2xl">Contributions</h1>
        <h2 class="whitespace-nowrap">{ contributionCount } {pluralize({ singular: "contribution", count: contributionCount })}</h2>
      </div>
      <button class="text-blue-500" onClick={refetch}>Refresh</button>
    </div>
    <div className={`${!isFetching ? "hidden" : ""} text-gray-500 text-center text-lg mb-4`}>Loading...</div>
    {
      !isFetching ? <>{
        !contributionCount && <div class="text-center">
          <em class="text-grey-800">No one has made a pledge yet.</em>
          <br />
          <em class="text-grey-800">You could be the first.</em>
        </div>
      }</> : <></>
    }
    <ul>
    {
      contributions.map((contribution) => {
        return <Contribution key={contribution.txHash + ":" + contribution.txIndex} contribution={contribution} goal={goal} />
      })
    }
    </ul>
  </div>
}

export default memo(ContributionList);