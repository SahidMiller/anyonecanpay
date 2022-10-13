import {forwardRef} from "react"

const Input = forwardRef((props, ref) => <input {...props} ref={ref}></input>);
const Select = forwardRef((props, ref) => <select {...props} ref={ref}></select>);

const FormInput = forwardRef(({ error, Component:_Component, noPadding, ...props }, ref) => {
  const className = `block h-10 w-full border ${props.readonly ? 'bg-gray-100' : ''} ${error ? 'border-red-300' : ''} rounded-lg outline-none bg-white ${noPadding ? "" : "px-3 py-1.5"} cursor-auto text-gray-600 transition-shadow focus:shadow-[0_0_0_0.2rem_rgb(0,123,255,0.25)] focus:border-blue-200 ${props.className || ""}`
  
  let Component;
  if (_Component) {
    Component = _Component;
  } else {
    Component = props.type === 'select' ? Select : Input
  }

  return <Component {...props} className={className} ref={ref}>{ props.children }</Component>
});

export default FormInput;