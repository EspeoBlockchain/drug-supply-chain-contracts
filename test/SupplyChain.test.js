/* globals artifacts, contract, expect, it, web3 */

const SupplyChain = artifacts.require('SupplyChain');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
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
    const actual = await sut.getPackageInfo.call(packageIdBytes);
    expect(actual.packageId).to.equal(packageId);
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
      const actual = await sut.getPackageInfo.call(packageIdBytes);
      expect(actual.receiverType).to.equal(`${receiverType}`);
    });
  });
});
