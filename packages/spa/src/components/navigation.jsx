import { ReactComponent as Logo } from "../../public/img/ipfs-flipstarter-logo-white.svg"
import { ReactComponent as Manage }from "../../public/img/icon/manage.svg"
import { ReactComponent as Create }from "../../public/img/icon/create.svg"
import { ReactComponent as Explore }from "../../public/img/icon/explore.svg"
import { ReactComponent as Settings }from "../../public/img/icon/settings.svg"

import { Link } from "preact-router"

export function NavigationItem({ url, displayName, children }) {
  return <Link href={url} class="lg:w-full navbar-item inline-block lg:block pt-2 pb-4 text-white no-underline font-medium hover:bg-white/10 text-center border-solid border-b-4 lg:border-0  b--navy"  role="menuitem"  title="Status">
    <div class="block px-2 py-1 flex flex-col justify-center items-center gap-2">
      <div class="opacity-50 fill-current inline-block">
        { children }
      </div>
      <div class="opacity-50 block text-sm text-center montserrat uppercase font-thin " style="white-space: pre-wrap;">{displayName}</div>
    </div>
  </Link>
}

export default function Navigation() {
  return <div class="navbar-container lg:flex-none bg-navy">
    <div class="h-full lg:fixed flex flex-col justify-between" style="overflow-y: auto; width: inherit;">
      <div class="flex flex-col">
        <a href="#/welcome" role="menuitem" title="Welcome Page">
          <div class="pt-3 pb-1 lg:pb-2">
            <div class="navbar-logo block mx-auto pt-3 pb-1" alt=""><Logo style="width:100%;height:100%"/></div>
          </div>
        </a>
        <div class="flex flex-row lg:flex-col justify-center gap-4 items-center overflow-x-scroll lg:overflow-x-hidden nowrap text-center mt-4" role="menubar">
          <NavigationItem url="#/manage" displayName="Manage"><Manage /></NavigationItem>
          <NavigationItem url="#/create" displayName="Create"><Create /></NavigationItem>
          <NavigationItem url="#/settings" displayName="Settings"><Settings /></NavigationItem>
          <NavigationItem url="#/explore" displayName="Explore"><Explore /></NavigationItem>
        </div>
      </div>
      <div class="hidden lg:block navbar-footer mb2 text-center text-sm opacity-80 transition-opacity ease-in hover:opacity-100">
        <div class="mb1">
          <a class="no-underline white" style="text-decoration-line: none;" href="https://gitlab.com/ipfs-flipstarter/admin" target="_blank" rel="noopener noreferrer">See the code</a>
        </div>
        <div>
          <a class="no-underline white" style="text-decoration-line: none;" href="https://gitlab.com/ipfs-flipstarter/admin/-/issues" target="_blank" rel="noopener noreferrer">Report a bug</a>
        </div>
      </div>
    </div>
  </div>
}