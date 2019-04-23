const expect = require('./expect');

module.exports = actualDrugItem => async ({
  from, to, whenHandoverLogIndex, expectedConditions,
}) => {
  const actualTransitConditions = await actualDrugItem.getTransitConditions(
    from,
    to,
    (await actualDrugItem.handoverLog(whenHandoverLogIndex)).when,
  );
  expect(actualTransitConditions.temperature).to.equal(`${expectedConditions.temperature}`);
  expect(actualTransitConditions.category).to.equal(`${expectedConditions.category}`);
};
