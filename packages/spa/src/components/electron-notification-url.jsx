import { useEffect, useCallback } from "react";
import FloatingLabel from "./inputs/floating-label.jsx";
import useCopy from "../hooks/useCopy.js";

export function ElectronNotificationUrl({ setHeading, setPrimaryButton, setSubheading, bip21Uri }) {
  const [copyBip21Uri, copyBip21UriSuccess] = useCopy(bip21Uri);
  
  const onBip21UrlClick = useCallback((e) => {
    e.target.focus();
    e.target.select();
    copyBip21Uri();
  }, [copyBip21Uri]);

  useEffect(() => {
    setHeading("Finally, broadcast your contribution!");
  }, [setHeading]);

  useEffect(() => {
    setSubheading(<>Copy the following data and paste into Electron Cash's <b>Send</b> Tab</>);
  }, [setSubheading])

  useEffect(() => {
    setPrimaryButton("Done")
  }, [setPrimaryButton]);

  return <div class="flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 mt-6">
    <input data-testid="bip21Uri" value={bip21Uri} readonly class="peer w-full text-black outline-0" id="bip21Uri" type="text" name="bip21Uri" placeholder="&nbsp;" onClick={onBip21UrlClick}></input>
    <FloatingLabel for="bip21Uri" className="absolute top-1 left-4 translate-y-3 bg-transparent">Bip 21</FloatingLabel>
    <div className="h-8 flex gap-2 absolute inset-y-1/2 right-4 -translate-y-1/2">
      <div className="h-full bg-gray-400 p-4 text-center inline-flex justify-center items-center rounded text-white shadow-xl cursor-pointer hover:bg-gray-500" onClick={onBip21UrlClick}>{ copyBip21UriSuccess ? "Copied!" : "Copy" }</div>
      <a href={bip21Uri} target="_blank" className="h-full bg-gray-400 p-4 text-center inline-flex justify-center items-center rounded text-white shadow-xl cursor-pointer hover:bg-gray-500">Open</a>
    </div>
  </div>
}