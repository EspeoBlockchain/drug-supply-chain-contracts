const {
  expectPurchasabilityCodes,
  participants,
  carrierCategories,
  purchasabilityCodes,
} = require('./common');

const PurchasabilityValidator = artifacts.require('PurchasabilityValidator');
const DrugItem = artifacts.require('DrugItem');
const { hexToBytes, randomHex } = web3.utils;

contract('PurchasabilityValidator', (accounts) => {
  const drugItemId = randomHex(32);
  const drugItemIdBytes = hexToBytes(drugItemId);
  const day = 24 * 3600;

  const vendor = participants.vendor(accounts[1]);
  const carrier1 = participants.carrier(accounts[2], carrierCategories.Truck);
  const carrier2 = participants.carrier(accounts[3], carrierCategories.Ship);
  const pharmacy = participants.pharmacy(accounts[4]);

  let sut;

  beforeEach(async () => {
    sut = await PurchasabilityValidator.new();
  });

  const logHandoverFromCarrier = async (drugItem, from, to) => {
    await drugItem.logHandover(from.id, to.id, to.category);
    const { when } = await drugItem.getLastHandover();
    await drugItem.logTransitConditions(from.id, to.id, when, from.conditions.temperature, from.conditions.category);
  };

  it('should return success code if the drug item is valid for purchase', async () => {
    // given
    const drugItem = await DrugItem.new(drugItemIdBytes, vendor.id, pharmacy.id, pharmacy.category);
    // when
    const actualCodes = await sut.isPurchasable(drugItem.address);
    // then
    expectPurchasabilityCodes(actualCodes).toEqual([purchasabilityCodes.ValidForPurchase]);
  });

  it('should return error code if the drug item is not in a pharmacy', async () => {
    // given
    const drugItem = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    // when
    const actualCodes = await sut.isPurchasable(drugItem.address);
    // then
    expectPurchasabilityCodes(actualCodes).toEqual([purchasabilityCodes.NotInPharmacy]);
  });

  it('should return error code if the drug item was handed over by carriers more than twice', async () => {
    // given
    const drugItem = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    await logHandoverFromCarrier(drugItem, carrier1, carrier2);
    await logHandoverFromCarrier(drugItem, carrier2, carrier1);
    await logHandoverFromCarrier(drugItem, carrier1, carrier2);
    await logHandoverFromCarrier(drugItem, carrier2, pharmacy);
    // when
    const actualCodes = await sut.isPurchasable(drugItem.address);
    // then
    expectPurchasabilityCodes(actualCodes).toEqual([purchasabilityCodes.TooManyHandovers]);
  });

  const carrierWithTemperature = (category, temperature) => {
    const carrier = participants.carrier(accounts[9], category);
    carrier.conditions.temperature = temperature;
    return carrier;
  };

  const carrierTooHighTemperatureTestCases = [{
    name: 'ship temperature was above -18 degrees',
    carrier: carrierWithTemperature(carrierCategories.Ship, -17),
  }, {
    name: 'airplane temperature was above -10 degrees',
    carrier: carrierWithTemperature(carrierCategories.Airplane, -9),
  }, {
    name: 'truck temperature was above -18 degrees',
    carrier: carrierWithTemperature(carrierCategories.Truck, -17),
  }];

  carrierTooHighTemperatureTestCases.forEach(({ name, carrier }) => {
    it(`should return error code if ${name}`, async () => {
      // given
      const drugItem = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
      await logHandoverFromCarrier(drugItem, carrier1, carrier);
      await logHandoverFromCarrier(drugItem, carrier, pharmacy);
      // when
      const actualCodes = await sut.isPurchasable(drugItem.address);
      // then
      expectPurchasabilityCodes(actualCodes).toEqual([purchasabilityCodes.TemperatureTooHigh]);
    });
  });

  it('should return error code if temperature dropped below -22 degrees', async () => {
    // given
    const drugItem = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    const carrier = carrierWithTemperature(carrierCategories.Ship, -23);
    await logHandoverFromCarrier(drugItem, carrier1, carrier);
    await logHandoverFromCarrier(drugItem, carrier, pharmacy);
    // when
    const actualCodes = await sut.isPurchasable(drugItem.address);
    // then
    expectPurchasabilityCodes(actualCodes).toEqual([purchasabilityCodes.TemperatureTooLow]);
  });

  it('should return error code if transit took more than 8 days', async () => {
    // given
    const drugItem = await DrugItem.new(drugItemIdBytes, vendor.id, carrier1.id, carrier1.category);
    await web3.evm.increaseTime(4 * day);
    await logHandoverFromCarrier(drugItem, carrier1, carrier2);
    await web3.evm.increaseTime(4 * day);
    await logHandoverFromCarrier(drugItem, carrier2, carrier1);
    await web3.evm.increaseTime(1); // only a second over 8 days
    await logHandoverFromCarrier(drugItem, carrier1, pharmacy);
    // when
    const actualCodes = await sut.isPurchasable(drugItem.address);
    // then
    expectPurchasabilityCodes(actualCodes).toEqual([purchasabilityCodes.TotalTransitDurationTooLong]);
  });

  const singleTransitDurationTooLongTestCases = [{
    name: 'ship transit took more than 4 days',
    carrier: participants.carrier(accounts[9], carrierCategories.Ship),
    transitDuration: 4 * day + 1,
  }, {
    name: 'truck transit took more than 4 days',
    carrier: participants.carrier(accounts[9], carrierCategories.Truck),
    transitDuration: 4 * day + 1,
  }, {
    name: 'airplane transit took more than 1 day',
    carrier: participants.carrier(accounts[9], carrierCategories.Airplane),
    transitDuration: 1 * day + 1,
  }];

  singleTransitDurationTooLongTestCases.forEach(({ name, carrier, transitDuration }) => {
    it(`should return error code if ${name}`, async () => {
      // given
      const drugItem = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
      await web3.evm.increaseTime(transitDuration);
      await logHandoverFromCarrier(drugItem, carrier, pharmacy);
      // when
      const actualCodes = await sut.isPurchasable(drugItem.address);
      // then
      expectPurchasabilityCodes(actualCodes).toEqual([purchasabilityCodes.SingleTransitDurationTooLong]);
    });
  });

  it('should combine all error codes', async () => {
    // given
    const carrierWithTemperatureTooHigh = participants.carrier(accounts[8], carrierCategories.Ship);
    carrierWithTemperatureTooHigh.conditions.temperature = -1;
    const carrierWithTemperatureTooLow = participants.carrier(accounts[9], carrierCategories.Truck);
    carrierWithTemperatureTooLow.conditions.temperature = -30;
    const drugItem = await DrugItem.new(
      drugItemIdBytes,
      vendor.id,
      carrierWithTemperatureTooHigh.id,
      carrierWithTemperatureTooHigh.category,
    );
    await web3.evm.increaseTime(9 * day);
    await logHandoverFromCarrier(drugItem, carrierWithTemperatureTooHigh, carrierWithTemperatureTooLow);
    await logHandoverFromCarrier(drugItem, carrierWithTemperatureTooLow, carrier1);
    await logHandoverFromCarrier(drugItem, carrier1, carrier2);
    await logHandoverFromCarrier(drugItem, carrier2, carrier1);
    // when
    const actualCodes = await sut.isPurchasable(drugItem.address);
    // then
    const allErrorCodes = [
      Object.values(purchasabilityCodes)
        .filter(code => code > purchasabilityCodes.ValidForPurchase),
    ];
    expectPurchasabilityCodes(actualCodes).toEqual(...allErrorCodes);
  });
});
