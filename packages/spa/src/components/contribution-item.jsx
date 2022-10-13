import { useMemo } from "react";
import prettyPrintSats from "../utils/prettyPrintSats.js";
import { useIpfs } from "../hooks/useIpfs.js";
import useCommitmentDataQuery from "../hooks/useCommitmentDataQuery.js";

import createDOMPurify from 'dompurify';
const DOMPurify = createDOMPurify(window);

export default function Contribution({ contribution, goal }) {
  const { ipfs } = useIpfs();

  const { data: commitmentData } = useCommitmentDataQuery(contribution)

  const data = useMemo(() => {
    return ({
      comment: DOMPurify.sanitize(commitmentData?.comment),
      alias: DOMPurify.sanitize(commitmentData?.alias)
    });

  }, [commitmentData]);

  const [contributionAmountText, contributionDenomination] = prettyPrintSats(contribution.satoshis);
  const percentContribution = Math.round(goal ? (contribution.satoshis / goal).toFixed(2) * 100 : 0);
  
  const backgroundMin = 3.8;
  const backgroundMax = 0;
  const backgroundPosition = ((backgroundMin + backgroundMax) * (1 - (percentContribution / 100))).toFixed(2);
  const animationLength = 15;
  const animationDelay = (Math.random() * animationLength).toFixed(2);

  return <li data-testid="contributions-list-item"  class="contributionContainer flex flex-row items-center gap-4 mb-4">
    <div class="h-16 relative rounded-full xs:w-20">
      <div class="flex justify-center items-center bg-transparent contributionDisplay h-16 w-16 m-0 p-0 overflow-hidden relative rounded-full z-20" style="box-shadow: inset 0rem 0.1rem 0.2rem rgb(0 0 0 / 31%);">
        <div class="waves absolute bg-contain bg-repeat-x block h-16 w-64 z-10" style={`background-position: 0px ${backgroundPosition}rem;animation-delay: ${animationDelay}s;`}></div>
        <span class="contributionPercent block font-mono text-lg font-bold z-10 -mr-2">{ percentContribution }%</span>
      </div>
    </div>
    <span class="contributionDetails xs:basis-full">
      <span class="line flex flex-col xs:flex-row justify-between flex-wrap">
        <b class="contributionAlias">{ data && data.alias || "Anonymous" }</b>
        <small class="contributionAmount nowrap">{ contributionAmountText } { contributionDenomination }</small>
      </span>
      { (contribution.cid) && <span class={`line flex-row flex-wrap ${ data && data.comment ? "justify-between" : "xs:justify-end"}`}>
        { data && data.comment && <q class='text-sm hidden sm:block contributionComment quote'>{data.comment}</q> }
        {/* { contribution.cid && <span class="contributionLinks">
          <small><a href={useIpfsGateway(contribution.cid)} class={`contributionCidLink text-blue-600 cursor-pointer ${ data && "border-r border-r-1 pr-2 mr-2 border-gray-400"}`} target="_blank">IPFS</a></small>
            { data && 
              <small>
                <a 
                  href={useDownloader(data)} 
                  download="pledge.json"
                  class="contributionDataLink text-blue-600 cursor-pointer" 
                  target="_blank">Download</a>
              </small> 
            }
        </span> } */}
      </span> }
    </span>
  </li>
}