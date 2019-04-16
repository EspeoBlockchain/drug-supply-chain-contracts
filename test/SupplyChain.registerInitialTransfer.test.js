/* globals artifacts, contract, it, web3 */

const expect = require('./expect');

const SupplyChain = artifacts.require('SupplyChain');
const Package = artifacts.require('Package');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain.registerInitialTransfer()', async (accounts) => {
  const packageId = randomHex(32);
  const packageIdBytes = hexToBytes(packageId);
  const receiverType = 0; // Transporter
  const producer = accounts[0];
  const receiver = accounts[1];

  it('should register initial transfer', async () => {
    // given
    const sut = await SupplyChain.new();
    // when
    await sut.registerInitialTransfer(packageIdBytes, receiver, receiverType, { from: producer });
    // then
    const packageAddress = await sut.getPackage.call(packageIdBytes);
    const actual = await Package.at(packageAddress);
    await expect(actual.packageId()).to.eventually.equal(packageId);
    await expect(actual.producer()).to.eventually.equal(producer);
    await expect(actual.owner()).to.eventually.equal(sut.address);

    const actualTransfer = await actual.transferLog.call(0);
    expect(actualTransfer.to).to.equal(receiver);
    expect(actualTransfer.from).to.equal(producer);
  });

  ['Transporter', 'Pharmacy'].forEach((name, type) => {
    it(`should allow ${name} receiver type`, async () => {
      // given
      const sut = await SupplyChain.new();
      // when
      await sut.registerInitialTransfer(packageIdBytes, receiver, type, { from: producer });
      // then
      const actual = await Package.at(await sut.getPackage.call(packageIdBytes));
      const { receiverType: actualType } = (await actual.transferLog.call(0));
      expect(actualType).to.be.a.bignumber.that.equals(web3.utils.toBN(type));
    });
  });

  it('should not allow unknown receiver type', async () => {
    // given
    const sut = await SupplyChain.new();
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, receiver, 99, { from: producer });
    // then
    await expect(promise).to.be.rejected;
  });

  it('should not allow registering same package twice', async () => {
    // given
    const sut = await SupplyChain.new();
    await sut.registerInitialTransfer(packageIdBytes, receiver, receiverType, { from: producer });
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, receiver, receiverType, { from: producer });
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is already known');
  });

  it('should not allow registering package with empty id', async () => {
    // given
    const sut = await SupplyChain.new();
    // when
    const promise = sut.registerInitialTransfer([], receiver, receiverType, { from: producer });
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is empty');
  });
});
