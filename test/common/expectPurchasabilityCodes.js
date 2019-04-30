const expect = require('./expect');

const { hexToNumberString } = web3.utils;

const expectedMaximumLength = 10;

module.exports = actualCodes => ({
  toEqual: (expectedCodes) => {
    const expected = [
      ...expectedCodes.map(hexToNumberString),
      ...Array(expectedMaximumLength - expectedCodes.length).fill('0'),
    ];

    const actual = actualCodes.map(String);

    expect(actual).to.deep.equal(expected);
  },
});
