import {render} from "react"
import { PRELOAD_NODES, DEFAULT_GATEWAY_URL, ELECTRUM_SERVERS } from "./utils/constants.js"
import { IpfsFlipstarterProvider } from "./flipstarter.jsx";

const minimumLoading = new Promise((resolve) => setTimeout(resolve, 500));;

async function init() {
  if (process.env.NODE_ENV === "development") {
    await import('preact/devtools');
  }

  let App, props = {};

  try {
    
    const campaign = window.campaign = await fetch('./campaign.json').then(response => response.json());
    App = (await import('./apps/campaign.jsx')).default;
    props.campaign = campaign;

  } catch (err) {
    console.log(err);
    App = (await import('./apps/admin.jsx')).default;
  }
  await render(
    <IpfsFlipstarterProvider preloadNodes={PRELOAD_NODES} defaultGatewayUrl={DEFAULT_GATEWAY_URL} electrumServers={ELECTRUM_SERVERS}>
      <App { ...props }></App>
    </IpfsFlipstarterProvider>
  , document.getElementById("app"));

  await minimumLoading;

  setTimeout(() => {
    const loader = document.getElementById("main-loader");
    if (loader) loader.remove()
    
    document.body.classList.remove("loading");
  }, 1000);
}

init();