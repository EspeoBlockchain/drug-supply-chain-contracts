const expect = require('./expect');

const { toBN } = web3.utils;

module.exports = actualDrugItem => async ({ atIndex, expectedTo, expectedHandoverCount }) => {
  const actualHandoverCount = await actualDrugItem.getHandoverCount();
  expect(actualHandoverCount).to.be.a.bignumber.that.equals(toBN(expectedHandoverCount));

  const actualHandover = await actualDrugItem.handoverLog(atIndex);
  expect(actualHandover.to.id).to.equal(expectedTo.id);
  expect(actualHandover.to.category).to.equal(`${expectedTo.category}`);
  expect(actualHandover.when).to.be.a.bignumber.that.equals(toBN((await web3.eth.getBlock('latest')).timestamp));
};
