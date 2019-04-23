const {
  expect,
  assertHandover,
  data,
  participantCategories,
  carrierCategories,
} = require('./common');

const DrugItem = artifacts.require('DrugItem');
const { hexToBytes, randomHex } = web3.utils;

contract('DrugItem', async (accounts) => {
  const drugItemId = randomHex(32);
  const drugItemIdBytes = hexToBytes(drugItemId);
  const vendor = data.vendor(accounts[1]);
  const carrier = data.carrier(accounts[2]);
  const pharmacy = data.pharmacy(accounts[3]);

  it('should set the creator as the primary', async () => {
    // when
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    // then
    const actualPrimary = await sut.primary();
    expect(actualPrimary).to.equal(accounts[0]);
  });

  it('should create a drug item and register initial handover', async () => {
    // when
    const actual = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    // then
    await expect(actual.drugItemId()).to.eventually.equal(drugItemId);
    await expect(actual.vendor()).to.eventually.equal(vendor.id);
    await expect(actual.primary()).to.eventually.equal(accounts[0]);

    await assertHandover(actual)({
      atIndex: 0,
      expectedHandoverCount: 1,
      expectedTo: carrier,
    });

    // no transit conditions should be present
    const actualTransitConditions = await actual.getTransitConditions(
      vendor.id,
      carrier.id,
      (await actual.handoverLog(0)).when,
    );
    expect(actualTransitConditions.temperature).to.equal('0');
    expect(actualTransitConditions.category).to.equal(`${carrierCategories.NotApplicable}`);
  });

  // TODO shouldn't be able to do a initial transfer to a producer
  Object.entries(participantCategories).forEach(([name, category]) => {
    it(`should create drug item with ${name} participant category`, async () => {
      // when
      const actual = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, category);
      // then
      const actualCategory = (await actual.handoverLog(0)).to.category;
      expect(actualCategory).to.equal(`${category}`);
    });
  });

  it('should not allow unknown participant category when creating drugItem', async () => {
    // when
    const promise = DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, 99);
    // then
    await expect(promise).to.be.rejected;
  });

  it('should not allow empty id when creating drugItem', async () => {
    // when
    const promise = DrugItem.new([], vendor.id, carrier.id, carrier.category);
    // then
    await expect(promise).to.be.rejectedWith('Given drugItemId is empty');
  });

  it('should register a subsequent handover', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    // when
    await sut.logHandover(
      pharmacy.id,
      pharmacy.category,
    );
    // then
    await assertHandover(sut)({
      atIndex: 1,
      expectedHandoverCount: 2,
      expectedTo: pharmacy,
    });
  });

  // TODO test 'should not allow unknown carrier category when registering handovers'
  it('should not allow non-owner to register next handovers', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    // when
    const promise = sut.logHandover(
      pharmacy.id,
      pharmacy.category,
      { from: pharmacy.id },
    );
    // then
    await expect(promise).to.be.rejected;
  });

  // TODO test transit conditions
  /*
    const actualTransitConditions = await sut.getTransitConditions(
      carrier.id,
      pharmacy.id,
      actualHandover.when,
    );
    expect(actualTransitConditions.temperature).to.equal(`${carrier.conditions.temperature}`);
    expect(actualTransitConditions.category).to.equal(`${carrier.conditions.category}`);
  */
});
