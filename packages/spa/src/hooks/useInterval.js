import { useEffect, useRef } from "react";

/**
 * Routinely call a function at some interval and clean up when it returns false.
 *  
 * @param {() => boolean} cb function to call at each interval, returns boolean for clearing interval
 * @param {Array} dependencies watched dependencies (passed in to cb)
 */
export function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default useInterval;