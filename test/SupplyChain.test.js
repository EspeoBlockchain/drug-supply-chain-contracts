/* globals artifacts, contract, expect, it, web3 */

const SupplyChain = artifacts.require('SupplyChain');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
  it('should register initial transfer', async () => {
    // given
    const sut = await SupplyChain.deployed();
    const packageId = randomHex(32);
    const packageIdBytes = hexToBytes(packageId);
    const from = accounts[0];
    const to = accounts[1];
    // when
    await sut.registerInitialTransfer(packageIdBytes, to, { from });
    // then
    const actual = await sut.getPackageInfo.call(packageIdBytes);
    expect(actual.packageId).to.equal(packageId);
    expect(actual.to).to.equal(to);
    expect(actual.from).to.equal(from);
  });
});
