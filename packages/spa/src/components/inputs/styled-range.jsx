import styled from "styled-components"

export const StyledRange= styled.input.attrs({ type: "range" })`
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background: #c8c8c8;
  border: none;
  border-radius: 0.25rem;
  height: 0.5rem;
  margin: 0;
  /* position: absolute; */
  top: 0;
  width: 100%;

  &::-webkit-slider-thumb {
    -webkit-appearance:none;
    appearance:none;
    background:#02a95c;
    border:4px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 6px rgba(0,0,0,.1);
    cursor:pointer;
    height:2rem;
    outline:none;
    position:relative;
    width:2rem;
    z-index:20
  }

  &.disabled::-webkit-slider-thumb {
    background:#c8c8c8
  }
`

export default StyledRange;