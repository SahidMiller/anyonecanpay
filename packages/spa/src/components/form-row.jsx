export default function FormRow({ gap = 4, mb = 2, justify, ...props }) {
  const className = `flex flex-col sm:flex-row ${justify ? justify : "justify-between"} items-end gap-${gap} mb-${mb} ${props.className || ""}`
  return <div {...props} className={className}>{ props.children }</div>
}