/* eslint-disable */
import $ from 'jquery'
import { get } from 'idb-keyval';

export default async function restoreScroll() {
  const scrollHeight = await get("scrollHeight")
  //Only scroll if we have a title
  if ($("#title").val() && scrollHeight) {
    window.scrollTo(0, scrollHeight)
  } else {
    window.scrollTo(0, 0)
  }
}