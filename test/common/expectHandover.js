const expect = require('./expect');
const expectBignumber = require('./expectBignumber');

module.exports = actualHandover => ({
  toHaveToIdThatEquals: (expectedId) => {
    expect(actualHandover.to.id).to.equal(expectedId);
  },
  toHaveToCategoryThatEquals: (expectedCategory) => {
    expect(actualHandover.to.category).to.equal(`${expectedCategory}`);
  },
  toHaveWhenEqualToLatestBlockTimestamp: async () => {
    const latestBlockTimestamp = (await web3.eth.getBlock('latest')).timestamp;
    expectBignumber(actualHandover.when).toEqual(latestBlockTimestamp);
  },
});
