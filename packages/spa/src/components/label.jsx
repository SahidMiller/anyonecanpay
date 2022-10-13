export default function Label({ ...props }) {
  return <label {...props} className={`block mb-2 text-gray-600 ${props.className || ""}`}>{ props.children }</label>
}