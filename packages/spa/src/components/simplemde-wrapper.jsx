import SimpleMDE from "react-simplemde-editor";
import { useState, useEffect, useMemo, useCallback, useRef } from "react"

export default function SimpleMDEWrapper(props) {
  const { initialValue, readonly:readOnly } = props;

  const simpleMdeRef = useRef();
  const [codeMirror, setCodeMirror] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const mdeOptions = useMemo(() => {
    const options = {
      autoRefresh: 300, 
      previewClass: ["editor-preview", "markdown-body", "prose", "max-w-none", "prose-code:text-gray-700"],
    }
    if (readOnly) options.toolbar = false;

    return options;
  }, [readOnly]);

  const getCmInstanceCallback = useCallback((editor) => {
    setCodeMirror(editor);
  }, []);  
  
  const getMdeInstanceCallback = useCallback((simpleMde) => {
    simpleMdeRef.current = simpleMde;
  }, []);

  useEffect(() => {
    if (codeMirror) { 
      setTimeout(() => codeMirror.refresh(), 100);
    }
  }, [initialValue, codeMirror]);

  useEffect(() => {
    if (initialized || !simpleMdeRef.current) return;

    simpleMdeRef.current.value?.(initialValue);
    setInitialized(true);
  }, [initialized, simpleMdeRef.current]);

  useEffect(() => {
    if (codeMirror) {
      codeMirror.setOption('readOnly', readOnly);
    }
  }, [codeMirror, readOnly]);

  return <SimpleMDE
    className={`simple-mde ${readOnly ? "readonly" : ""} ${props.className || ""}`} 
    options={mdeOptions} 
    getMdeInstance={getMdeInstanceCallback} 
    getCodemirrorInstance={getCmInstanceCallback} 
    rows="4" 
    {...props}>
  </SimpleMDE>
}