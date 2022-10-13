export default function CtaButtons({ onPledge, onShare, forceRow }) {
  
  return <div class={`flex flex-row gap-4 w-full ${ !forceRow && 'flex-wrap sm:flex-nowrap' }`}>
    <div class="w-full">
      <button class="cta-btn primary-btn" onClick={onPledge}><span>Pledge</span></button>
    </div>
    <div class="w-full">
      <button class="cta-btn secondary-btn" onClick={onShare}><span>Share</span></button>
    </div>
  </div>
}