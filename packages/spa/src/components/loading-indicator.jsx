export default function LoadingIndicator() {
  return <div id="load-indicator-container" class="cover-area" style="background:white;z-index: 10;">
    <ul class="load-indicator animated -half-second">
      <li class="load-indicator__bubble"></li>
      <li class="load-indicator__bubble"></li>
      <li class="load-indicator__bubble"></li>
    </ul>
  </div>
}