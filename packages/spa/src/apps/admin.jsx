import Router, {route} from "preact-router";
import { createHashHistory } from "history";

import Navigation from "../components/navigation.jsx"
import CreatePage from "../pages/create.jsx"
import ManagePage from "../pages/manage.jsx"

import { useState } from "react"

import "../../public/css/admin.css";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleRoute = async e => {
    route(e.url, true);
  };

  return <div class="flex flex-col lg:flex-row min-h-screen text-lg">
    <Navigation></Navigation>
    <section class="w-full">
      <div class="p-2 xs:p-5">
        { isLoading ? <div id="load-indicator-container" class="cover-area" style="background:white;z-index: 1;">
          <ul class="load-indicator animated -half-second">
            <li class="load-indicator__bubble"></li>
            <li class="load-indicator__bubble"></li>
            <li class="load-indicator__bubble"></li>
          </ul>
        </div> : <></> }
        <div className={`${isLoading ? "hidden" : ""} justify-content-center shadow-sm xs:p-8 xs:border rounded`}>
          <Router history={createHashHistory()} onChange={handleRoute}>
            <CreatePage default path="/create" setIsLoading={setIsLoading} isLoading={isLoading} />
            <ManagePage path="/manage" setIsLoading={setIsLoading} isLoading={isLoading} />
            <CreatePage path="/manage/:id" setIsLoading={setIsLoading} isLoading={isLoading}/>
          </Router>
        </div>
      </div>
    </section>
  </div>
}