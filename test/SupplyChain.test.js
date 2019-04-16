const expect = require('./expect');

const SupplyChain = artifacts.require('SupplyChain');
const Package = artifacts.require('Package');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
  const packageId = randomHex(32);
  const packageIdBytes = hexToBytes(packageId);
  const receiverType = 0; // Transporter
  const producer = accounts[0];
  const receiver = accounts[1];

  it('should be owned by the creator', async () => {
    // when
    const sut = await SupplyChain.new();
    // then
    const actualOwner = await sut.owner.call();
    expect(actualOwner).to.equal(accounts[0]);
  });

  it('should register initial transfer', async () => {
    // given
    const sut = await SupplyChain.new();
    // when
    await sut.registerInitialTransfer(packageIdBytes, receiver, receiverType, { from: producer });
    // then
    const packageAddress = await sut.getPackage.call(packageIdBytes);
    const actual = await Package.at(packageAddress);
    await expect(actual.packageId()).to.eventually.equal(packageId);
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
});
