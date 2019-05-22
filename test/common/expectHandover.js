const expect = require('./expect');

module.exports = actualHandover => ({
  toHaveToIdThatEquals: (expectedId) => {
    expect(actualHandover.to.id).to.equal(expectedId);
  },
  toHaveToCategoryThatEquals: (expectedCategory) => {
    expect(actualHandover.to.category).to.equal(`${expectedCategory}`);
  },
  toHaveWhenEqualToLatestBlockTimestamp: async () => {
    const latestBlockTimestamp = String((await web3.eth.getBlock('latest')).timestamp);
    expect(actualHandover.when).to.equal(latestBlockTimestamp);
  },
});
