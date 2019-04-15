/* globals artifacts, contract, expect, it, web3 */

const SupplyChain = artifacts.require('SupplyChain');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
  it('should register initial transfer', async () => {
    // given
    const sut = await SupplyChain.deployed();
    const packageId = hexToBytes(randomHex(32));
    const to = accounts[1];
    // when
    await sut.registerInitialTransfer(packageId, to);
    // then
    const actual = await sut.getPackageInfo.call(packageId);
    expect(actual).to.be.ok;
  });
});
