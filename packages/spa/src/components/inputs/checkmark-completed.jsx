import styled from "styled-components"
// Define vars we'll be using

let brandSuccess = `#5cb85c`;
let loaderSize = `7em`;
let checkHeight = `calc(${loaderSize}/2)`;
let checkWidth = `calc(${checkHeight}/2)`;
let checkLeft = `calc(${loaderSize}/6 + ${loaderSize}/12)`;
let checkThickness = `3px`;
let checkColor = `${brandSuccess}`;

const CircleLoader = styled.div`
  & {
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-left-color: ${checkColor};
    animation: loader-spin 1.2s infinite linear;
    position: relative;
    display: inline-block;
    vertical-align: top;
    border-radius: 50%;
    width: ${loaderSize};
    height: ${loaderSize};
  }

  &.load-complete {
    -webkit-animation: none;
    animation: none;
    border-color: ${checkColor};
    transition: border 500ms ease-out;
  }

  .draw:after {
    animation-duration: 800ms;
    animation-timing-function: ease;
    animation-name: checkmark;
    transform: scaleX(-1) rotate(135deg);
  }

  .checkmark:after {
    opacity: 1;
    height: ${checkHeight};
    width: ${checkWidth};
    transform-origin: left top;
    border-right: ${checkThickness} solid ${checkColor};
    border-top: ${checkThickness} solid ${checkColor};
    content: '';
    left: ${checkLeft};
    top: ${checkHeight};
    position: absolute;
  }

  @keyframes loader-spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes checkmark {
    0% {
      height: 0;
      width: 0;
      opacity: 1;
    }
    20% {
      height: 0;
      width: ${checkWidth};
      opacity: 1;
    }
    40% {
      height: ${checkHeight};
      width: ${checkWidth};
      opacity: 1;
    }
    100% {
      height: ${checkHeight};
      width: ${checkWidth};
      opacity: 1;
    }
  }`

export default function CompleteCheckmarkLoader({ loadComplete = false, ...props }) {

  return <>
    <CircleLoader {...props} className={`${loadComplete ? 'load-complete' : ''} ${props.className || ""}`}>
      <div className={`${loadComplete ? "block" : "hidden"} checkmark draw`}></div>
    </CircleLoader>
  </>
}