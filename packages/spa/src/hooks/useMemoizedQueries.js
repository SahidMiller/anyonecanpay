import { useRef } from "react"
import { useQueryClient, QueriesObserver } from "react-query";
import { useState, useEffect } from "react";

/**
 * Use memoized queries (referential integrity)
 * 
 * @param {import('react-query').QueriesOptions<T>} options queries options
 * @returns {import('react-query').QueriesResults<T>} 
 */
 export function useMemoizedQueries(options) {
  const queryClient = useQueryClient();
  const observerRef = useRef();
  observerRef.current = observerRef.current || new QueriesObserver(queryClient, options.queries); // Update queries

  if (observerRef.current.hasListeners()) {
    observerRef.current.setQueries(options.queries);
  }

  const [currentResult, setCurrentResult] = useState(() => {
    return observerRef.current.getCurrentResult();
  })

  useEffect(() => {
    return observerRef.current.subscribe((result) => {
      setCurrentResult(result);
    });
  }, [observerRef.current]);

  return currentResult
}