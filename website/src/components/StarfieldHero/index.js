import React from 'react';
import stars from "@site/static/js/stars.js";

export default function StarfieldHero({ title, children }) {
  React.useEffect(async () => {
    const PIXI = await import('pixi.js');
    stars(PIXI);
  }, []);

  return <div
  id="stars"
  className="
    relative
    bg-gradient-6
    pt-10
    xs:pt-20
    h-screen
    max-h-168
    sm:max-h-1200
    min-h-640
  "
  >
  <div
    className="hero-container absolute left-0 right-0 mx-auto grid-margins mb-20"
  >
    { !!title && <div
      className="flex flex-col justify-center items-center text-white"
    >
      <h1 className="pb-5 text-center">{ title }</h1>
      <span className="divider block mx-auto bg-blueGreenLight mb-5" />
      { children }
    </div> }
  </div> 
  <button
    id="toggle-animation"
    className="
      absolute
      left-0
      bottom-0
      text-xs
      m-1.5
      py-1.5
      px-2
      transition
      duration-300
      ease-in-out
    "
  >
    Disable animation
  </button>
  <a
    href="#why"
    className="
      view-more
      block
      absolute
      bottom-8
      w-full
      sm:hidden
      hover:opacity-75
    "
  >
  </a>
  </div>
}