/* eslint-disable max-len */
const {
  expect,
  expectHandover,
  expectDrugItem,
  expectTransitConditions,
  getTransitConditions,
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
  const carrier1 = participants.carrier(accounts[2]);
  const carrier2 = participants.carrier(accounts[3]);
  const pharmacy = participants.pharmacy(accounts[4]);
  const otherAccount = accounts[9];

  it('should set the creator as the owner', async () => {
    // when
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    // then
    const actualOwner = await sut.owner();
    expect(actualOwner).to.equal(accounts[0]);
  });

  it('should create a drug item and register initial handover', async () => {
    // when
    const actual = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    // then
    await expect(actual.getDrugItemId()).to.eventually.equal(drugItemId);
    await expect(actual.getVendor()).to.eventually.equal(vendor.id);
    await expect(actual.owner()).to.eventually.equal(accounts[0]);
    await expectDrugItem(actual).toHaveHandoverCountThatEquals(1);

    const actualHandover = await actual.getHandover(0);
    expectHandover(actualHandover).toHaveToIdThatEquals(carrier1.id);
    expectHandover(actualHandover).toHaveToCategoryThatEquals(carrier1.category);
    await expectHandover(actualHandover).toHaveWhenEqualToLatestBlockTimestamp();

    // no transit conditions should be present
    const actualTransitConditions = await getTransitConditions(actual, vendor.id, carrier1.id, 0);
    expectTransitConditions(actualTransitConditions).toEqualConditions({
      temperature: 0,
      category: carrierCategories.NotApplicable,
    });
  });

  Object.entries(participantCategories)
    .filter(([name]) => name !== 'Vendor')
    .forEach(([name, category]) => {
      it(`should create drug item with ${name} participant category`, async () => {
        // when
        const actual = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, category);
        // then
        const actualCategory = (await actual.getHandover(0)).to.category;
        expect(actualCategory).to.equal(`${category}`);
      });
    });

  it('should not allow an initial handover to a vendor', async () => {
    // when
    const promise = DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, participantCategories.Vendor);
    // then
    await expect(promise).to.be.rejectedWith('Drug item can\'t be handed over to a vendor');
  });

  it('should not allow a handover to a vendor', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    // when
    const promise = sut.logHandover(
      carrier1.id,
      pharmacy.id,
      participantCategories.Vendor,
    );
    // then
    await expect(promise).to.be.rejectedWith('Drug item can\'t be handed over to a vendor');
  });

  it('should not allow unknown participant category when creating drugItem', async () => {
    // when
    const promise = DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, 99);
    // then
    await expect(promise).to.be.rejected;
  });

  it('should not allow empty id when creating drugItem', async () => {
    // when
    const promise = DrugItem.new([], vendor.id, carrier1.id, carrier1.category);
    // then
    await expect(promise).to.be.rejectedWith('Given drugItemId is empty');
  });

  it('should register a subsequent handover', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    // when
    await sut.logHandover(
      carrier1.id,
      pharmacy.id,
      pharmacy.category,
    );
    // then
    await expectDrugItem(sut).toHaveHandoverCountThatEquals(2);
    const actualHandover = await sut.getHandover(1);
    expectHandover(actualHandover).toHaveToIdThatEquals(pharmacy.id);
    expectHandover(actualHandover).toHaveToCategoryThatEquals(pharmacy.category);
    await expectHandover(actualHandover).toHaveWhenEqualToLatestBlockTimestamp();
  });

  it('should not allow non-owner to register next handovers', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    // when
    const promise = sut.logHandover(
      carrier1.id,
      pharmacy.id,
      pharmacy.category,
      { from: otherAccount },
    );
    // then
    await expect(promise).to.be.rejected;
  });

  it('should not allow unknown carrier category when registering handovers', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    // when
    const promise = sut.logHandover(
      pharmacy.id,
      99,
    );
    // then
    await expect(promise).to.be.rejected;
  });

  it('should not allow a handover from participant other than the last handover\'s "to" participant', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    // when
    const handoverLog = sut.logHandover(otherAccount, pharmacy.id, pharmacy.category);
    // then
    await expect(handoverLog).to.be.rejectedWith('Handover must be done by the current drug item holder');
  });

  it('should not allow a handover if the current holder is a carrier that did not log transit conditions', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    await sut.logHandover(carrier1.id, carrier2.id, carrier2.category);
    // when
    const handoverLog = sut.logHandover(carrier2.id, pharmacy.id, pharmacy.category);
    // then
    await expect(handoverLog).to.be.rejectedWith('Transit conditions must be logged before next handover');
  });

  it('should return the only handover after initial handover', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    // when
    const actualHandover = await sut.getLastHandover();
    // then
    expect(actualHandover.to.id).to.equal(carrier1.id);
    expect(actualHandover.to.category).to.equal(`${carrier1.category}`);
    const latestBlockTimestamp = (await web3.eth.getBlock('latest')).timestamp;
    expect(actualHandover.when).to.equal(`${latestBlockTimestamp}`);
  });

  it('should return the last handover after a sequence of handovers', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    await sut.logHandover(carrier1.id, pharmacy.id, pharmacy.category);
    // when
    const actualHandover = await sut.getLastHandover();
    // then
    expect(actualHandover.to.id).to.equal(pharmacy.id);
    expect(actualHandover.to.category).to.equal(`${pharmacy.category}`);
    const latestBlockTimestamp = (await web3.eth.getBlock('latest')).timestamp;
    expect(actualHandover.when).to.equal(`${latestBlockTimestamp}`);
  });

  it('should log transit conditions', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    await sut.logHandover(carrier1.id, pharmacy.id, pharmacy.category);
    const { when } = await sut.getLastHandover();
    // when
    await sut.logTransitConditions(
      carrier1.id,
      pharmacy.id,
      when,
      carrier1.conditions.temperature,
      carrier1.conditions.category,
    );
    // then
    const actualTransitConditions = await getTransitConditions(sut, carrier1.id, pharmacy.id, 1);
    expectTransitConditions(actualTransitConditions).toEqualConditions(carrier1.conditions);
  });

  it('should not allow logging transing conditions from participant other than the second to last handover\'s "to" participant', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    await sut.logHandover(carrier1.id, pharmacy.id, pharmacy.category);
    const { when } = await sut.getLastHandover();
    // when
    const transitConditionsLog = sut.logTransitConditions(
      otherAccount,
      pharmacy.id,
      when,
      carrier1.conditions.temperature,
      carrier1.conditions.category,
    );
    // then
    await expect(transitConditionsLog).to.be.rejectedWith('Transit conditions can be logged only for the last handover');
  });

  it('should not allow logging transing conditions to participant other than the last handover\'s "to" participant', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    await sut.logHandover(carrier1.id, pharmacy.id, pharmacy.category);
    const { when } = await sut.getLastHandover();
    // when
    const transitConditionsLog = sut.logTransitConditions(
      carrier1.id,
      otherAccount,
      when,
      carrier1.conditions.temperature,
      carrier1.conditions.category,
    );
    // then
    await expect(transitConditionsLog).to.be.rejectedWith('Transit conditions can be logged only for the last handover');
  });

  it('should not allow logging transing conditions for time different than the last handover\'s time', async () => {
    // given
    const sut = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    await sut.logHandover(carrier1.id, pharmacy.id, pharmacy.category);
    // when
    const transitConditionsLog = sut.logTransitConditions(
      carrier1.id,
      pharmacy.id,
      999999,
      carrier1.conditions.temperature,
      carrier1.conditions.category,
    );
    // then
    await expect(transitConditionsLog).to.be.rejectedWith('Transit conditions can be logged only for the last handover');
  });
});
