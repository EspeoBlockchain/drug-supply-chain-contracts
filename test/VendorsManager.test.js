const { expect } = require('./common');

const VendorsManager = artifacts.require('VendorsManager');

contract('VendorsManager', async (accounts) => {
  const vendor = accounts[1];

  let sut;

  beforeEach(async () => {
    // given
    sut = await VendorsManager.new();
  });

  it('should be owned by the creator', async () => {
    // then
    const actualOwner = await sut.owner();
    expect(actualOwner).to.equal(accounts[0]);
  });

  it('should allow owner to register a vendor', async () => {
    // when
    await sut.registerVendor(vendor);
    // then
    const actual = await sut.isVendor(vendor);
    expect(actual).to.be.true;
  });

  it('should allow owner to deregister a vendor', async () => {
    // given
    await sut.registerVendor(vendor);
    // when
    await sut.deregisterVendor(vendor);
    // then
    const actual = await sut.isVendor(vendor);
    expect(actual).to.be.false;
  });

  it('should not allow non-owner to register a vendor', async () => {
    // when
    const vendorRegistration = sut.registerVendor(vendor, { from: vendor });
    // then
    await expect(vendorRegistration).to.be.rejected;
  });

  it('should not allow non-owner to deregister a vendor', async () => {
    // given
    await sut.registerVendor(vendor);
    // when
    const vendorDeregistration = sut.deregisterVendor(vendor, { from: vendor });
    // then
    await expect(vendorDeregistration).to.be.rejected;
  });
});
