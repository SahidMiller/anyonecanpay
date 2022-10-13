import { useState, useCallback, useRef } from "react";
import copyToClipboard from "copy-to-clipboard";

export default function useCopy(copyText, { timeout = 2000, ...options } = {}) {
  const copyTextRef = useRef();
  copyTextRef.current = copyText;

  const [showSuccessfulCopy, setShowSuccessfulCopy] = useState(false);
  const copy = useCallback(() => {
    copyToClipboard(copyTextRef.current, options);
    
    setShowSuccessfulCopy(true);
    setTimeout(() => {
      setShowSuccessfulCopy(false);
    }, timeout)
  }, [copyText]);

  return [copy, showSuccessfulCopy];
}