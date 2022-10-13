import "regenerator-runtime"
import { render, screen } from "@testing-library/preact"
import globalJsdom from "global-jsdom"
import {ContributionProvider} from "../src/components/withContributions.js"
import Landing from "../src/pages/landing.jsx"
import { QueryClientProvider, QueryClient } from "react-query"

globalJsdom()

jest.mock('../src/components/withContributions.js', () => ({
  useContributions: jest.fn(() => {
    return { contributions: [{ satoshis: 500 }, { satoshis: 500 }], isFullfilled: false }
  })
}));

jest.mock("react-intersection-observer", () => ({
  useInView: jest.fn(() => {
    return [() => {}, false]
  })
}));

jest.mock("../src/utils/markdown.js", () => {
  return () => ""
});

test('renders the landing page', () => {

  const mockElectrum = {};

  const campaign = { 
    recipients: [{ satoshis: 2000 }], 
    descriptions: { 
      en: {
        abstract: "",
        proposal: ""
      }
    } 
  };

  const { getAllByTestId } = render(
    <Landing campaign={campaign} />
  );
  
  
  expect(document.querySelector(".total-raised").textContent).toBe("1000 SATS raised of 2000 SAT goal 2 contributions");
  const contributionItems = getAllByTestId("contributions-list-item");
  expect(contributionItems).toHaveLength(2)
  
  contributionItems.forEach((item) => {
    expect(item.textContent).toBe("25%Anonymous500 SATS")
  });
});