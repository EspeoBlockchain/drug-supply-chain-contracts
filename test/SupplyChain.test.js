const {
  expect,
  expectHandover,
  expectDrugItem,
  expectTransitConditions,
  expectPurchasabilityCodes,
  getTransitConditions,
  participants,
  carrierCategories,
  purchasabilityCodes,
} = require('./common');

const SupplyChain = artifacts.require('SupplyChain');
const DrugItem = artifacts.require('DrugItem');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
  const drugItemId = randomHex(32);
  const drugItemIdBytes = hexToBytes(drugItemId);

  const vendor = participants.vendor(accounts[1]);
  const carrier1 = participants.carrier(accounts[2], carrierCategories.Truck);
  const carrier2 = participants.carrier(accounts[3], carrierCategories.Ship);
  const carrier3 = participants.carrier(accounts[4], carrierCategories.Airplane);
  const pharmacy = participants.pharmacy(accounts[5]);
  const unknownVendor = participants.vendor(accounts[6]);

  let sut;

  beforeEach(async () => {
    // given
    sut = await SupplyChain.new();
    await sut.registerVendor(vendor.id);
  });

  it('should register initial handover from a vendor', async () => {
    // when
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);
    await expect(actualDrugItem.getDrugItemId()).to.eventually.equal(drugItemId);

    await expectDrugItem(actualDrugItem).toHaveHandoverCountThatEquals(1);
    const actualHandover = await actualDrugItem.getHandover(0);
    expectHandover(actualHandover).toHaveToIdThatEquals(carrier1.id);
    expectHandover(actualHandover).toHaveToCategoryThatEquals(carrier1.category);
    await expectHandover(actualHandover).toHaveWhenEqualToLatestBlockTimestamp();

    const actualTransitConditions = await getTransitConditions(actualDrugItem, vendor.id, carrier1.id, 0);
    expectTransitConditions(actualTransitConditions).toEqualConditions({
      temperature: 0,
      category: carrierCategories.NotApplicable,
    });
  });

  it('should not allow registering same drug item twice', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // when
    const initialHandoverRegistration = sut.registerInitialHandover(
      drugItemIdBytes,
      carrier1.id,
      carrier1.category,
      { from: vendor.id },
    );
    // then
    await expect(initialHandoverRegistration).to.be.rejectedWith('Given drug item is already known');
  });

  it('should not allow uknown vendor to register an initial handover', async () => {
    // when
    const initialHandoverRegistration = sut.registerInitialHandover(
      drugItemIdBytes,
      carrier1.id,
      carrier1.category,
      { from: unknownVendor.id },
    );
    // then
    await expect(initialHandoverRegistration).to.be.rejectedWith('Transaction sender is an unknown vendor');
  });

  it('should register handover from a carrier to another carrier', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // when
    await sut.registerHandover(
      drugItemIdBytes,
      carrier2.id,
      carrier2.category,
      carrier1.conditions.temperature,
      carrier1.conditions.category,
      { from: carrier1.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    await expectDrugItem(actualDrugItem).toHaveHandoverCountThatEquals(2);
    const actualHandover = await actualDrugItem.getHandover(1);
    expectHandover(actualHandover).toHaveToIdThatEquals(carrier2.id);
    expectHandover(actualHandover).toHaveToCategoryThatEquals(carrier2.category);
    await expectHandover(actualHandover).toHaveWhenEqualToLatestBlockTimestamp();

    const actualTransitConditions = await getTransitConditions(actualDrugItem, carrier1.id, carrier2.id, 1);
    expectTransitConditions(actualTransitConditions).toEqualConditions(carrier1.conditions);
  });

  it('should register handover from a carrier to pharmacy', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // when
    await sut.registerHandover(
      drugItemIdBytes,
      pharmacy.id,
      pharmacy.category,
      carrier1.conditions.temperature,
      carrier1.conditions.category,
      { from: carrier1.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    await expectDrugItem(actualDrugItem).toHaveHandoverCountThatEquals(2);
    const actualHandover = await actualDrugItem.getHandover(1);
    expectHandover(actualHandover).toHaveToIdThatEquals(pharmacy.id);
    expectHandover(actualHandover).toHaveToCategoryThatEquals(pharmacy.category);
    await expectHandover(actualHandover).toHaveWhenEqualToLatestBlockTimestamp();

    const actualTransitConditions = await getTransitConditions(actualDrugItem, carrier1.id, pharmacy.id, 1);
    expectTransitConditions(actualTransitConditions).toEqualConditions(carrier1.conditions);
  });

  it('should register a subsequent handover from a carrier to another carrier', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    await sut.registerHandover(
      drugItemIdBytes,
      carrier2.id,
      carrier2.category,
      carrier1.conditions.temperature,
      carrier1.conditions.category,
      { from: carrier1.id },
    );
    // when
    await sut.registerHandover(
      drugItemIdBytes,
      carrier3.id,
      carrier3.category,
      carrier2.conditions.temperature,
      carrier2.conditions.category,
      { from: carrier2.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    await expectDrugItem(actualDrugItem).toHaveHandoverCountThatEquals(3);
    const actualHandover = await actualDrugItem.getHandover(2);
    expectHandover(actualHandover).toHaveToIdThatEquals(carrier3.id);
    expectHandover(actualHandover).toHaveToCategoryThatEquals(carrier3.category);
    await expectHandover(actualHandover).toHaveWhenEqualToLatestBlockTimestamp();

    const actualTransitConditions = await getTransitConditions(actualDrugItem, carrier2.id, carrier3.id, 1);
    expectTransitConditions(actualTransitConditions).toEqualConditions(carrier2.conditions);
  });

  it('should register a subsequent handover from a carrier to a pharmacy', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    await sut.registerHandover(
      drugItemIdBytes,
      carrier2.id,
      carrier2.category,
      carrier1.conditions.temperature,
      carrier1.conditions.category,
      { from: carrier1.id },
    );
    // when
    await sut.registerHandover(
      drugItemIdBytes,
      pharmacy.id,
      pharmacy.category,
      carrier2.conditions.temperature,
      carrier2.conditions.category,
      { from: carrier2.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    await expectDrugItem(actualDrugItem).toHaveHandoverCountThatEquals(3);
    const actualHandover = await actualDrugItem.getHandover(2);
    expectHandover(actualHandover).toHaveToIdThatEquals(pharmacy.id);
    expectHandover(actualHandover).toHaveToCategoryThatEquals(pharmacy.category);
    await expectHandover(actualHandover).toHaveWhenEqualToLatestBlockTimestamp();

    const actualTransitConditions = await getTransitConditions(actualDrugItem, carrier2.id, pharmacy.id, 1);
    expectTransitConditions(actualTransitConditions).toEqualConditions(carrier2.conditions);
  });

  it('should not allow registering handover of an unknown drug item', async () => {
    // when
    const handoverRegistration = sut.registerHandover(
      drugItemIdBytes,
      carrier2.id,
      carrier2.category,
      carrier1.conditions.temperature,
      carrier1.conditions.category,
      { from: carrier1.id },
    );
    // then
    await expect(handoverRegistration).to.be.rejectedWith('Given drug item is unknown');
  });

  it('should check purchasability of a drug item', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, pharmacy.id, pharmacy.category, { from: vendor.id });
    // when
    const actualCodes = await sut.isPurchasable(drugItemId);
    // then
    expectPurchasabilityCodes(actualCodes).toEqual([purchasabilityCodes.ValidForPurchase]);
  });

  it('should not allow checking purchasability of unknown drug item', async () => {
    // when
    const purchasable = sut.isPurchasable(drugItemId);
    // then
    await expect(purchasable).to.be.rejectedWith('Given drug item is unknown');
  });
});
