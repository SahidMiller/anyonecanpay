import { useState, useRef, useEffect } from "react";
import useInterval from "../hooks/useInterval.js";

export default function Summary({ description, details }) {
  
  const [showReadMoreButton, setShowReadMoreButton] = useState(false);
  const [showingMore, showMore] = useState(false);
  const summaryRef = useRef();
  
  const [checkInterval, setCheckInterval] = useState(true);

  useInterval(() => {
    const shouldShowReadMore = !showingMore && summaryRef.current && summaryRef.current.clientHeight < summaryRef.current.scrollHeight;  
    if (shouldShowReadMore) {
      setShowReadMoreButton(true);
    }
  }, checkInterval && !showReadMoreButton && 200);

  useEffect(() => {
    setTimeout(10000, () => {
      setCheckInterval(false);
    })
  }, []);

  function onReadMore(e) {
    e.preventDefault(); 
    showMore(true);
  }  

  return <>
  <div ref={summaryRef} class={`relative ${!showingMore && 'max-h-60 overflow-hidden'}`}>
    <header id="campaignAbstract" class="markdown-body prose max-w-none prose-code:text-gray-700" dangerouslySetInnerHTML={{__html: description}}></header>
    { showReadMoreButton && !showingMore && <div class="w-full h-8 absolute top-52 bottom-0" style="background: linear-gradient(180deg,hsla(0,0%,100%,0) 0,#fff);"></div>}
  </div>
  
  { showReadMoreButton && !showingMore && <div class="mt-2"><a href="#" class="text-blue-500 text-lg underline" onClick={onReadMore}>Read more</a></div> }
  </>
}