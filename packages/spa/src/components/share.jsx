import { useMemo } from "react";

import iconList from "./share/icon-list.jsx";
import SocialIcons from "./share/social-icons.jsx";

const defaultSites = Object.keys(iconList).slice(0, 8);

export default function Share({
  data,
  onClick,
  sites = defaultSites,
}) {
  const shareData = useMemo(() => {
    const url = data?.url || (typeof window !== "undefined" && window.location.href) || "";
    const title = data?.title || "Decentralized Fundraiser";
    const twitterLength = 280 - (url?.length || 0);
    let text = data?.text?.length > twitterLength ? data.text.match(RegExp(`^[\\S\\s]{0,${twitterLength}}`))?.[0] : data.text || "";
    text = text && text.replace(/\s+/g, ' ')


    return { ...data, title, text, url }
  }, [data]);

  return <SocialIcons sites={sites} data={shareData} />
};