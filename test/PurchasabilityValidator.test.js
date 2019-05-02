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

  const vendor = participants.vendor(accounts[1]);
  const carrier = participants.carrier(accounts[2], carrierCategories.Truck);

  let sut;

  beforeEach(async () => {
    sut = await PurchasabilityValidator.new();
  });

  it('should return error code if the drug item is not in a pharmacy', async () => {
    // given
    const drugItem = await DrugItem.new(drugItemIdBytes, vendor.id, carrier.id, carrier.category);
    // when
    const actualCodes = await sut.isPurchasable(drugItem.address);
    // then
    expectPurchasabilityCodes(actualCodes).toEqual([purchasabilityCodes.NotInPharmacy]);
  });
});
