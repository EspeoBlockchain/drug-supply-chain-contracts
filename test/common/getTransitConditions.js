module.exports = async (drugItem, from, to, handoverLogIndex) => drugItem.getTransitConditions(
  from,
  to,
  (await drugItem.getHandover(handoverLogIndex)).when,
);
