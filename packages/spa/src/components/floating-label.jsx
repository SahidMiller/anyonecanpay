import styled from "styled-components"

const FloatingLabel = styled.div.attrs({
  className: "pointer-events-none"
})`
  .peer:focus ~ &, .peer:not(:placeholder-shown) ~ & {
    background-color: white;
    color: rgba(0, 0, 0);
    font-size: 0.75rem;
    line-height: 1rem;
    padding: 0.125rem;

    --tw-translate-y: -0.75rem;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  }
`

export default FloatingLabel;