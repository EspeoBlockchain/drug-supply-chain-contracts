const expect = require('./expect');
const expectBignumber = require('./expectBignumber');

const { hexToNumber } = web3.utils;

const expectedMaximumLength = 10;

module.exports = actualCodes => ({
  toEqual: (expectedCodes) => {
    expect(actualCodes.length).to.equal(expectedMaximumLength);

    for (let i = 0; i < expectedCodes.length; i += 1) {
      const actualCode = hexToNumber(actualCodes[i]);
      expect(actualCode).to.equal(expectedCodes[i]);
    }

    for (let i = expectedCodes.length; i < expectedMaximumLength; i += 1) {
      expectBignumber(actualCodes[i]).toEqual(0);
    }
  },
});
