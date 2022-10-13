export default function PrimaryButton(props) {
  return <>
    <button {...props} className={`${props.className || ""} w-full sm:w-auto text-white px-8 py-4 rounded bg-green-600 hover:bg-green-700 tracking-wide font-semibold shadow-lg disabled:bg-gray-300`} type="button">{props.children}</button>
  </>
}