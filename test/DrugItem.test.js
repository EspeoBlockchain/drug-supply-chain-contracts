const {
  expect,
  assertHandover,
  assertTransitConditions,
  participants,
  participantCategories,
  carrierCategories,
} = require('./common');

const DrugItem = artifacts.require('DrugItem');
const { hexToBytes, randomHex } = web3.utils;

contract('DrugItem', async (accounts) => {
  const drugItemId = randomHex(32);
  const drugItemIdBytes = hexToBytes(drugItemId);
  const vendor = participants.vendor(accounts[1]);
  const carrier = participants.carrier(accounts[2]);
  const pharmacy = participants.pharmacy(accounts[3]);

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

  Object.entries(participantCategories)
    .filter(([name]) => name !== 'Vendor')
    .forEach(([name, category]) => {
      it(`should create drug item with ${name} participant category`, async () => {
        // when
        const actual = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, category);
        // then
        const actualCategory = (await actual.handoverLog(0)).to.category;
        expect(actualCategory).to.equal(`${category}`);
      });
    });

  it('should not allow an initial handover to a vendor', async () => {
    // when
    const promise = DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, participantCategories.Vendor);
    // then
    await expect(promise).to.be.rejectedWith('Drug item can\'t be handed over back to any vendor');
  });

  it('should not allow a handover to a vendor', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    // when
    const promise = sut.logHandover(
      pharmacy.id,
      participantCategories.Vendor,
    );
    // then
    await expect(promise).to.be.rejectedWith('Drug item can\'t be handed over back to any vendor');
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

  it('should not allow unknown carrier category when registering handovers', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    // when
    const promise = sut.logHandover(
      pharmacy.id,
      99,
    );
    // then
    await expect(promise).to.be.rejected;
  });

  it('should return the only handover after initial handover', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    // when
    const actualHandover = await sut.getLastHandover();
    // then
    expect(actualHandover.to.id).to.equal(carrier.id);
    expect(actualHandover.to.category).to.equal(`${carrier.category}`);
    expect(actualHandover.when).to.equal(`${(await web3.eth.getBlock('latest')).timestamp}`);
  });

  it('should return the last handover after a sequence of handovers', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    await sut.logHandover(pharmacy.id, pharmacy.category);
    // when
    const actualHandover = await sut.getLastHandover();
    // then
    expect(actualHandover.to.id).to.equal(pharmacy.id);
    expect(actualHandover.to.category).to.equal(`${pharmacy.category}`);
    expect(actualHandover.when).to.equal(`${(await web3.eth.getBlock('latest')).timestamp}`);
  });

  it('should log transit conditions', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    await sut.logHandover(pharmacy.id, pharmacy.category);
    const { when } = await sut.getLastHandover();
    // when
    await sut.logTransitConditions(
      carrier.id,
      pharmacy.id,
      when,
      carrier.conditions.temperature,
      carrier.conditions.category,
    );
    // then
    await assertTransitConditions(sut)({
      from: carrier.id,
      to: pharmacy.id,
      whenHandoverLogIndex: 0,
      expectedConditions: carrier.conditions,
    });
  });
});
