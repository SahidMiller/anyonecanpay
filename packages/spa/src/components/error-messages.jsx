export function getErrorMessage(error, messages) {
  const message = messages && error && error.type && messages[error.type];
  return typeof message === 'function' ? message(error) : message ;
}

export default function ErrorMessages({ error, messages }) {
  const message = getErrorMessage(error, messages);
  return  message ? <span class="text-red-500 text-sm">{message}</span> : <></>
}