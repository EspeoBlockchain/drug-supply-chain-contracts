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

  it('should be owned by the creator', async () => {
    // then
    const actualOwner = await sut.owner();
    expect(actualOwner).to.equal(accounts[0]);
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

  it('should allow owner to register a producer', async () => {
    // when
    await sut.registerProducer(producer);
    // then
    const actual = await sut.isProducer(producer);
    expect(actual).to.be.true;
  });

  it('should allow owner to deregister a producer', async () => {
    // given
    await sut.registerProducer(producer);
    // when
    await sut.deregisterProducer(producer);
    // then
    const actual = await sut.isProducer(producer);
    expect(actual).to.be.false;
  });

  it('should not allow non-owner to register a producer', async () => {
    // when
    const promise = sut.registerProducer(producer, { from: producer });
    // then
    await expect(promise).to.be.rejected;
  });

  it('should not allow non-owner to deregister a producer', async () => {
    // given
    await sut.registerProducer(producer);
    // when
    const promise = sut.deregisterProducer(producer, { from: producer });
    // then
    await expect(promise).to.be.rejected;
  });
});
