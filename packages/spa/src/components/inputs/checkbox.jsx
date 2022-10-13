import styled from "styled-components";

const Checkbox = styled.input.attrs({
  className: "cursor-pointer appearance-none h-6 w-6 flex-shrink-0 rounded-full border border-2 border-green-400 hover",
  type: "checkbox"
})`
  &:checked {
    background: radial-gradient(circle,#16a34a 45%,#fff 0);
  }

  &:hover:not(:disabled) {
    box-shadow: 0 0 0 0.625rem #16a34a0f
  }
`

export default Checkbox