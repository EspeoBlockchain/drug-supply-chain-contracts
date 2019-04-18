const {
  expect,
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
    await expect(actual.vendor()).to.eventually.equal(vendor);
    await expect(actual.primary()).to.eventually.equal(accounts[0]);

    const actualHandoverCount = await actual.getHandoverCount();
    expect(actualHandoverCount).to.be.a.bignumber.that.equals('1');
    const actualHandover = await actual.handoverLog(0);
    expect(actualHandover.from.id).to.equal(vendor.id);
    expect(actualHandover.from.category).to.be.a.bignumber.that.equals(`${vendor.category}`);
    expect(actualHandover.to.id).to.equal(carrier.id);
    expect(actualHandover.to.category).to.be.a.bignumber.that.equals(`${carrier.category}`);
    expect(actualHandover.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);

    const actualTransitConditions = await actual.getTransitConditions(
      vendor.id,
      carrier.id,
      actualHandover.when,
    );
    expect(actualTransitConditions.temperature).to.be.a.bignumber.that.equals('0');
    expect(actualTransitConditions.category).to.be.a.bignumber.that.equals(`${carrierCategories.NotApplicable}`);
  });

  // TODO shouldn't be able to do a initial transfer to a producer
  Object.entries(participantCategories).forEach(([name, category]) => {
    it(`should create drug item with ${name} participant category`, async () => {
      // when
      const actual = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, category);
      // then
      const { participantCategory: actualCategory } = (await actual.handoverLog(0));
      expect(actualCategory).to.be.a.bignumber.that.equals(`${category}`);
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
      carrier.id,
      pharmacy.id,
      pharmacy.category,
      carrier.conditions.temperature,
      carrier.conditions.category,
    );
    // then
    const actualHandoverCount = await sut.getHandoverCount();
    expect(actualHandoverCount).to.be.a.bignumber.that.equals('2');
    const actualHandover = await sut.handoverLog(1);
    expect(actualHandover.from.id).to.equal(carrier.id);
    expect(actualHandover.from.category).to.be.a.bignumber.that.equals(`${carrier.category}`);
    expect(actualHandover.to.id).to.equal(pharmacy.id);
    expect(actualHandover.to.category).to.be.a.bignumber.that.equals(`${pharmacy.category}`);
    expect(actualHandover.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);

    const actualTransitConditions = await sut.getTransitConditions(
      carrier.id,
      pharmacy.id,
      actualHandover.when,
    );
    expect(actualTransitConditions.temperature).to.be.a.bignumber.that.equals(`${carrier.conditions.temperature}`);
    expect(actualTransitConditions.category).to.be.a.bignumber.that.equals(`${carrier.conditions.category}`);
  });

  // TODO test 'should not allow unknown carrier category when registering handovers'
  it('should not allow non-owner to register next handovers', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    // when
    const promise = sut.logHandover(
      carrier.id,
      pharmacy.id,
      pharmacy.category,
      carrier.conditions.temperature,
      carrier.conditions.category,
      { from: pharmacy.id },
    );
    // then
    await expect(promise).to.be.rejected;
  });
});
