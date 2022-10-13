export default function FormItem({ error, success, ...props }) {
  const className = `w-full pb-3 ${props.className || ""}`
  return <div {...props} className={className}>
    { props.children }
    { error ? <span class="absolute text-red-500 text-sm">{ error }</span> : <></> }
    { error ? <span class="absolute text-green-500 text-sm">{ success }</span> : <></> }
  </div>
}