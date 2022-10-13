import { useEffect, useCallback } from "react";
import FloatingLabel from "./inputs/floating-label.jsx";

export function ElectronCommentForm({ setHeading, setPrimaryButton, comment, alias, setComment, setAlias, setDisablePrimaryButton }) {
  const onAliasChanged = useCallback((e) => setAlias(e.target.value), []);
  const onCommentChanged = useCallback((e) => setComment(e.target.value), []);

  useEffect(() => {
    setDisablePrimaryButton(false)
  }, []);

  useEffect(() => {
    setHeading("Optionally, add a mesesage to be displayed on the campaign.");
  }, [setHeading]);

  useEffect(() => {
    setPrimaryButton(!comment && !alias ? "Skip" : "Next")
  }, [setPrimaryButton, comment, alias]);

  return <>
    <fieldset className="flex flex-col gap-2 py-3">
      <div class="flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
        <input class="w-full peer text-black outline-0" id="alias" type="text" name="alias" placeholder="&nbsp;" onChange={onAliasChanged}></input>
        <FloatingLabel for="alias" className="absolute top-1 left-4 translate-y-3 bg-transparent">Alias</FloatingLabel>
      </div>
      <div class="flex relative border rounded m-1 text-gray-500 pt-6 px-4 pb-2 ">
        <input class="w-full peer text-black outline-0" id="comment" type="text" name="comment" placeholder="&nbsp;" onChange={onCommentChanged}></input>
        <FloatingLabel for="comment" className="absolute top-1 left-4 translate-y-3 bg-transparent">Comment</FloatingLabel>
      </div>
    </fieldset>
  </>
}