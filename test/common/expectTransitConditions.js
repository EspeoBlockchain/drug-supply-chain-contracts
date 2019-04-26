const expect = require('./expect');

module.exports = actualTransitConditions => ({
  toEqualConditions: (expectedConditions) => {
    expect(actualTransitConditions.temperature).to.equal(`${expectedConditions.temperature}`);
    expect(actualTransitConditions.category).to.equal(`${expectedConditions.category}`);
  },
});
