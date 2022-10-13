import ContributionRow from "./contribution.jsx";

export default function CampaignContributionsView({ 
  contributions = [],
  showSelect,
  pickedContributions = [],
  onPickedContribution
}) {

  return <div class="overflow-x-auto w-full">{ !contributions.length ? 
    <div class="text-center text-gray-600 text-lg py-6 font-thin">No contributions found for this fundraiser.</div> :
    <>
      <table class="table w-full">
        {/* <!-- head --> */}
        <thead>
          <tr>
            { showSelect ? <th class="text-center pr-2">Select</th> : <></> }
            <th>Transaction</th>
            <th>State</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          { contributions.map((contribution) => {
              const id = contribution.txHash + ":" + contribution.txIndex;
              const selected = pickedContributions.indexOf(contribution) !== -1;

              return <ContributionRow key={id}
                contribution={contribution}
                showSelect={showSelect} 
                selected={showSelect && !!selected}
                onToggle={() => onPickedContribution(contribution)}
              ></ContributionRow>
            }) 
          }
        </tbody>    
      </table>
    </>
  }</div>
}