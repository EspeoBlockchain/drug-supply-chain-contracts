const expect = require('./expect');

const SupplyChain = artifacts.require('SupplyChain');
const Package = artifacts.require('Package');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
  const packageId = randomHex(32);
  const packageIdBytes = hexToBytes(packageId);
  const receiverType = 0; // Transporter
  const producer = accounts[1];
  const receiver = accounts[2];

  let sut;

  beforeEach(async () => {
    // given
    sut = await SupplyChain.new();
    await sut.registerProducer(producer);
  });

  it('should register initial transfer from a producer', async () => {
    // when
    await sut.registerInitialTransfer(packageIdBytes, receiver, receiverType, { from: producer });
    // then
    const packageAddress = await sut.getPackage(packageIdBytes);
    const actual = await Package.at(packageAddress);
    await expect(actual.packageId()).to.eventually.equal(packageId);
  });

  it('should not allow registering same package twice', async () => {
    // given
    await sut.registerInitialTransfer(packageIdBytes, receiver, receiverType, { from: producer });
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, receiver, receiverType, { from: producer });
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is already known');
  });

  it('should not allow uknown producer to register an initial transfer', async () => {
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, receiver, receiverType, { from: accounts[9] });
    // then
    await expect(promise).to.be.rejectedWith('Transaction sender is an unknown producer');
  });
});
