/* globals artifacts, contract, it, web3 */

const expect = require('./expect');

const SupplyChain = artifacts.require('SupplyChain');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain.registerInitialTransfer()', async (accounts) => {
  const packageId = randomHex(32);
  const packageIdBytes = hexToBytes(packageId);
  const receiver = 0; // Transporter
  const from = accounts[0];
  const to = accounts[1];

  it('should register initial transfer', async () => {
    // given
    const sut = await SupplyChain.new();
    // when
    await sut.registerInitialTransfer(packageIdBytes, to, receiver, { from });
    // then
    const [actual] = await sut.getPackageTransferLog.call(packageIdBytes);
    expect(actual.to).to.equal(to);
    expect(actual.from).to.equal(from);
  });

  ['Transporter', 'Pharmacy'].forEach((receiverName, receiverType) => {
    it(`should allow ${receiverName} receiver type`, async () => {
      // given
      const sut = await SupplyChain.new();
      // when
      await sut.registerInitialTransfer(packageIdBytes, to, receiverType, { from });
      // then
      const [actual] = await sut.getPackageTransferLog.call(packageIdBytes);
      expect(actual.receiverType).to.equal(`${receiverType}`); // web3 returns enum index as string
    });
  });

  it('should not allow unknown receiver type', async () => {
    // given
    const sut = await SupplyChain.new();
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, to, 99, { from });
    // then
    await expect(promise).to.be.rejected;
  });

  it('should not allow registering same package twice', async () => {
    // given
    const sut = await SupplyChain.new();
    await sut.registerInitialTransfer(packageIdBytes, to, receiver, { from });
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, to, receiver, { from });
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is already known');
  });

  it('should not allow registering package with empty id', async () => {
    // given
    const sut = await SupplyChain.new();
    // when
    const promise = sut.registerInitialTransfer([], to, receiver, { from });
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is empty');
  });
});
