const { expect, participantCategories, carrierCategories } = require('./common');

const SupplyChain = artifacts.require('SupplyChain');
const DrugItem = artifacts.require('DrugItem');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
  const drugItemId = randomHex(32);
  const drugItemIdBytes = hexToBytes(drugItemId);

  const vendor = {
    id: accounts[1],
    category: participantCategories.Vendor,
  };
  const carrier1 = {
    id: accounts[2],
    category: participantCategories.Carrier,
    conditions: {
      temperature: -20,
      category: carrierCategories.Ship,
    },
  };
  const carrier2 = {
    id: accounts[3],
    category: participantCategories.Carrier,
    conditions: {
      temperature: -22,
      category: carrierCategories.Airplane,
    },
  };
  const carrier3 = {
    id: accounts[4],
    category: participantCategories.Carrier,
    conditions: {
      temperature: -10,
      category: carrierCategories.Truck,
    },
  };
  const pharmacy = {
    id: accounts[5],
    category: participantCategories.Pharmacy,
  };
  const unknownVendor = {
    id: accounts[9],
    category: participantCategories.Vendor,
  };

  let sut;

  beforeEach(async () => {
    // given
    sut = await SupplyChain.new();
    await sut.registerVendor(vendor);
  });

  it('should register initial handover from a vendor', async () => {
    // when
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);
    await expect(actualDrugItem.drugItemId()).to.eventually.equal(drugItemId);

    const actualHandoverCount = await actualDrugItem.getHandoverCount();
    expect(actualHandoverCount).to.be.a.bignumber.that.equals('1');

    const actualHandover = await actualDrugItem.handoverLog(0);
    expect(actualHandover.from.id).to.equal(vendor.id);
    expect(actualHandover.from.category).to.be.a.bignumber.that.equals(`${vendor.category}`);
    expect(actualHandover.to.id).to.equal(carrier1.id);
    expect(actualHandover.to.category).to.be.a.bignumber.that.equals(`${carrier1.category}`);
    expect(actualHandover.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);

    const actualTransitConditions = await actualDrugItem.getTransitConditions(
      vendor.id,
      carrier1.id,
      actualHandover.when,
    );
    expect(actualTransitConditions.temperature).to.be.a.bignumber.that.equals('0');
    expect(actualTransitConditions.category).to.be.a.bignumber.that.equals(`${carrierCategories.NotApplicable}`);
  });

  it('should not allow registering same drug item twice', async () => {
    // given
    await sut.registerInitialHandover(drugItemIdBytes, carrier1.id, carrier1.category, { from: vendor.id });
    // when
    const promise = sut.registerInitialHandover(drugItemIdBytes, vendor.id, carrier1.id, { from: vendor.id });
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

    const actualHandoverCount = await actualDrugItem.getHandoverCount();
    expect(actualHandoverCount).to.be.a.bignumber.that.equals('2');

    const actualHandover = await actualDrugItem.handoverLog(1);
    expect(actualHandover.from.id).to.equal(carrier1.id);
    expect(actualHandover.from.category).to.be.a.bignumber.that.equals(`${carrier1.category}`);
    expect(actualHandover.to.id).to.equal(carrier2.id);
    expect(actualHandover.to.category).to.be.a.bignumber.that.equals(`${carrier2.category}`);
    expect(actualHandover.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);

    const actualTransitConditions = await actualDrugItem.getTransitConditions(
      carrier1.id,
      carrier2.id,
      actualHandover.when,
    );
    expect(actualTransitConditions.temperature).to.be.a.bignumber.that.equals('carrier1.conditions.temperature');
    expect(actualTransitConditions.category).to.be.a.bignumber.that.equals(`${carrier1.conditions.category}`);
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

    const actualHandoverCount = await actualDrugItem.getHandoverCount();
    expect(actualHandoverCount).to.be.a.bignumber.that.equals('2');

    const actualHandover = await actualDrugItem.handoverLog(1);
    expect(actualHandover.from.id).to.equal(carrier1.id);
    expect(actualHandover.from.category).to.be.a.bignumber.that.equals(`${carrier1.category}`);
    expect(actualHandover.to.id).to.equal(pharmacy.id);
    expect(actualHandover.to.category).to.be.a.bignumber.that.equals(`${pharmacy.category}`);
    expect(actualHandover.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);

    // TODO check conditions in a separate function
    expect(actualHandover.conditions.temperature).to.equal(`${carrier1.conditions.temperature}`);
    expect(actualHandover.conditions.carrierCategory).to.equal(`${carrier1.conditions.category}`);
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
      { from: carrier1.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    const actualHandoverCount = await actualDrugItem.getHandoverCount();
    expect(actualHandoverCount).to.be.a.bignumber.that.equals('3');

    const actualHandover = await actualDrugItem.handoverLog(2);
    expect(actualHandover.from.id).to.equal(carrier2.id);
    expect(actualHandover.from.category).to.be.a.bignumber.that.equals(`${carrier2.category}`);
    expect(actualHandover.to.id).to.equal(carrier3.id);
    expect(actualHandover.to.category).to.be.a.bignumber.that.equals(`${carrier3.category}`);
    expect(actualHandover.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);

    const actualTransitConditions = await actualDrugItem.getTransitConditions(
      carrier2.id,
      carrier3.id,
      actualHandover.when,
    );
    expect(actualTransitConditions.temperature).to.be.a.bignumber.that.equals('carrier2.conditions.temperature');
    expect(actualTransitConditions.category).to.be.a.bignumber.that.equals(`${carrier2.conditions.category}`);
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
      { from: carrier1.id },
    );
    // then
    const drugItemAddress = await sut.getDrugItem(drugItemIdBytes);
    const actualDrugItem = await DrugItem.at(drugItemAddress);

    const actualHandoverCount = await actualDrugItem.getHandoverCount();
    expect(actualHandoverCount).to.be.a.bignumber.that.equals('3');

    const actualHandover = await actualDrugItem.handoverLog(2);
    expect(actualHandover.from.id).to.equal(carrier2.id);
    expect(actualHandover.from.category).to.be.a.bignumber.that.equals(`${carrier2.category}`);
    expect(actualHandover.to.id).to.equal(pharmacy.id);
    expect(actualHandover.to.category).to.be.a.bignumber.that.equals(`${pharmacy.category}`);
    expect(actualHandover.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);

    const actualTransitConditions = await actualDrugItem.getTransitConditions(
      carrier2.id,
      pharmacy.id,
      actualHandover.when,
    );
    expect(actualTransitConditions.temperature).to.be.a.bignumber.that.equals('carrier2.conditions.temperature');
    expect(actualTransitConditions.category).to.be.a.bignumber.that.equals(`${carrier2.conditions.category}`);
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
