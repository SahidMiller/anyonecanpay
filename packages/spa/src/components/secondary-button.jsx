export default function SecondaryButton(props) {
  return <button {...props} className={`${props.className || ""} items-center block px-10 py-3.5 text-base font-medium text-center text-green-600 transition duration-500 ease-in-out transform border-2 border-white shadow-md rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}>
    { props.children }
  </button>
}