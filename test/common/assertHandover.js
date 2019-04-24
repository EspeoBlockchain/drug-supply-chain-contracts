const expect = require('./expect');
const expectBignumber = require('./expectBignumber');

module.exports = actualDrugItem => async ({ atIndex, expectedTo, expectedHandoverCount }) => {
  const actualHandoverCount = await actualDrugItem.getHandoverCount();
  expectBignumber(actualHandoverCount).toEqual(expectedHandoverCount);

  const actualHandover = await actualDrugItem.handoverLog(atIndex);
  expect(actualHandover.to.id).to.equal(expectedTo.id);
  expect(actualHandover.to.category).to.equal(`${expectedTo.category}`);
  expectBignumber(actualHandover.when).toEqual((await web3.eth.getBlock('latest')).timestamp);
};
