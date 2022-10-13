import validateNames from 'jsdom/lib/jsdom/living/helpers/validate-names.js'
import "jest-styled-components"

const name_ = validateNames.name;
validateNames.name = function (name) {
  try {
    name_(name)
  } catch (e) {}
};

jest.setTimeout(30000);