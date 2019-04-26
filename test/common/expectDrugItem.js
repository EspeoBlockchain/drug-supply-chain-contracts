const expectBignumber = require('./expectBignumber');

module.exports = actualDrugItem => ({
  toHaveHandoverCountThatEquals: async (expectedHandoverCount) => {
    const actualHandoverCount = await actualDrugItem.getHandoverCount();
    expectBignumber(actualHandoverCount).toEqual(expectedHandoverCount);
  },
});
