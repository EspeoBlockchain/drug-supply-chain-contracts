const {
  expect,
  assertHandover,
  assertTransitConditions,
  data,
  carrierCategories,
} = require('./common');

const SupplyChain = artifacts.require('SupplyChain');
const DrugItem = artifacts.require('DrugItem');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
  const drugItemId = randomHex(32);
  const drugItemIdBytes = hexToBytes(drugItemId);

  const vendor = data.vendor(accounts[1]);
  const carrier1 = data.carrier(accounts[2], carrierCategories.Truck);
  const carrier2 = data.carrier(accounts[3], carrierCategories.Ship);
  const carrier3 = data.carrier(accounts[4], carrierCategories.Airplane);
  const pharmacy = data.pharmacy(accounts[5]);
  const unknownVendor = data.vendor(accounts[6]);

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
    await expect(actualDrugItem.drugItemId()).to.eventually.equal(drugItemId);

    await assertHandover(actualDrugItem)({
      atIndex: 0,
      expectedHandoverCount: 1,
      expectedTo: carrier1,
    });

    await assertTransitConditions(actualDrugItem)({
      from: vendor.id,
      to: carrier1.id,
      whenHandoverLogIndex: 0,
      expectedConditions: {
        temperature: 0,
        category: carrierCategories.NotApplicable,
      },
    });
  });

  it('should not allow registering same drug item twice', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // when
    const promise = sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // then
    await expect(promise).to.be.rejectedWith('Given drug item is already known');
  });

  it('should not allow uknown vendor to register an initial handover', async () => {
    // when
    const promise = sut.registerInitialHandover(
      drugItemIdBytes,
      carrier1.id,
      carrier1.category,
      { from: unknownVendor.id },
    );
    // then
    await expect(promise).to.be.rejectedWith('Transaction sender is an unknown vendor');
  });

  it('should register handover from a carrier to another carrier', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // when
    await sut.registerHandover(
      drugItemIdBytes,
      carrier2.id, carrier2.category,
      carrier1.conditions.temperature, carrier1.conditions.category,
      { from: carrier1.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    await assertHandover(actualDrugItem)({
      atIndex: 1,
      expectedHandoverCount: 2,
      expectedTo: carrier2,
    });

    await assertTransitConditions(actualDrugItem)({
      from: carrier1.id,
      to: carrier2.id,
      whenHandoverLogIndex: 1,
      expectedConditions: carrier1.conditions,
    });
  });

  it('should register handover from a carrier to pharmacy', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // when
    await sut.registerHandover(
      drugItemIdBytes,
      pharmacy.id, pharmacy.category,
      carrier1.conditions.temperature, carrier1.conditions.category,
      { from: carrier1.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    await assertHandover(actualDrugItem)({
      atIndex: 1,
      expectedHandoverCount: 2,
      expectedTo: pharmacy,
    });

    await assertTransitConditions(actualDrugItem)({
      from: carrier1.id,
      to: pharmacy.id,
      whenHandoverLogIndex: 1,
      expectedConditions: carrier1.conditions,
    });
  });

  it('should register a subsequent handover from a carrier to another carrier', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    await sut.registerHandover(
      drugItemIdBytes,
      carrier2.id, carrier2.category,
      carrier1.conditions.temperature, carrier1.conditions.category,
      { from: carrier1.id },
    );
    // when
    await sut.registerHandover(
      drugItemIdBytes,
      carrier3.id, carrier3.category,
      carrier2.conditions.temperature, carrier2.conditions.category,
      { from: carrier2.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    await assertHandover(actualDrugItem)({
      atIndex: 2,
      expectedHandoverCount: 3,
      expectedTo: carrier3,
    });

    await assertTransitConditions(actualDrugItem)({
      from: carrier2.id,
      to: carrier3.id,
      whenHandoverLogIndex: 1,
      expectedConditions: carrier2.conditions,
    });
  });

  it('should register a subsequent handover from a carrier to a pharmacy', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    await sut.registerHandover(
      drugItemIdBytes,
      carrier2.id, carrier2.category,
      carrier1.conditions.temperature, carrier1.conditions.category,
      { from: carrier1.id },
    );
    // when
    await sut.registerHandover(
      drugItemIdBytes,
      pharmacy.id, pharmacy.category,
      carrier2.conditions.temperature, carrier2.conditions.category,
      { from: carrier2.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    await assertHandover(actualDrugItem)({
      atIndex: 2,
      expectedHandoverCount: 3,
      expectedTo: pharmacy,
    });

    await assertTransitConditions(actualDrugItem)({
      from: carrier2.id,
      to: pharmacy.id,
      whenHandoverLogIndex: 1,
      expectedConditions: carrier2.conditions,
    });
  });

  it('should not allow registering handover of an unknown drug item', async () => {
    // when
    const promise = sut.registerHandover(
      drugItemIdBytes,
      carrier2.id, carrier2.category,
      carrier1.conditions.temperature, carrier1.conditions.category,
      { from: carrier1.id },
    );
    // then
    await expect(promise).to.be.rejectedWith('Given drug item is unknown');
  });
});
