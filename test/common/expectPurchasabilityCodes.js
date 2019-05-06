const expect = require('./expect');

module.exports = actualCodes => ({
  toEqual: (expectedCodes) => {
    const expected = expectedCodes.map(String);
    const actual = actualCodes.map(String);

    expect(actual).to.include(...expected);
    expect(actual.length).to.equal(expected.length);
  },
});
