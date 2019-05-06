const expect = require('./expect');

const expectedMaximumLength = 10;

module.exports = actualCodes => ({
  toEqual: (expectedCodes) => {
    const expected = [
      ...expectedCodes.map(String),
      ...Array(expectedMaximumLength - expectedCodes.length).fill('0'),
    ];

    const actual = actualCodes.map(String);

    expect(actual.length).to.equal(expected.length);
    expect(actual).to.include(...expected);
  },
});
