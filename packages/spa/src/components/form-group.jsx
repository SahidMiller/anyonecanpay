export default function FormGroup({ ...props }) {
  const className = `${props.className || ""}`
  return <div {...props} className={className}>{props.children}</div>
}