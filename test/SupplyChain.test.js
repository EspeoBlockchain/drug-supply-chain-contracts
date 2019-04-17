const expect = require('./expect');

const SupplyChain = artifacts.require('SupplyChain');
const Package = artifacts.require('Package');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
  const packageId = randomHex(32);
  const packageIdBytes = hexToBytes(packageId);
  const transporter = 0; // Transporter
  const producer = accounts[1];
  const firstReceiver = accounts[2];
  const secondReceiver = accounts[3];
  const thirdReceiver = accounts[4];

  let sut;

  beforeEach(async () => {
    // given
    sut = await SupplyChain.new();
    await sut.registerProducer(producer);
  });

  it('should register initial transfer from a producer', async () => {
    // when
    await sut.registerInitialTransfer(packageIdBytes, firstReceiver, transporter, { from: producer });
    // then
    const packageAddress = await sut.getPackage(packageIdBytes);
    const actual = await Package.at(packageAddress);
    await expect(actual.packageId()).to.eventually.equal(packageId);
  });

  it('should not allow registering same package twice', async () => {
    // given
    await sut.registerInitialTransfer(packageIdBytes, firstReceiver, transporter, { from: producer });
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, firstReceiver, transporter, { from: producer });
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is already known');
  });

  it('should not allow uknown producer to register an initial transfer', async () => {
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, firstReceiver, transporter, { from: accounts[9] });
    // then
    await expect(promise).to.be.rejectedWith('Transaction sender is an unknown producer');
  });

  ['Transporter', 'Pharmacy'].forEach((name, type) => {
    it(`should register transfer from a transporter to a ${name}`, async () => {
      // given
      await sut.registerInitialTransfer(packageIdBytes, firstReceiver, type, { from: producer });
      // when
      await sut.registerTransfer(packageIdBytes, secondReceiver, type, { from: firstReceiver });
      // then
      const packageAddress = await sut.getPackage(packageIdBytes);
      const actualPackage = await Package.at(packageAddress);

      const actualTransferCount = await actualPackage.getTransferCount();
      expect(actualTransferCount).to.be.a.bignumber.that.equals('2');

      const actualTransfer = await actualPackage.transferLog(1);
      expect(actualTransfer.from).to.equal(firstReceiver);
      expect(actualTransfer.to).to.equal(secondReceiver);
      expect(actualTransfer.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);
      expect(actualTransfer.receiverType).to.be.a.bignumber.that.equals(`${type}`);
    });

    it(`should register a subsequent transfer from a transporter to ${name}`, async () => {
      // given
      await sut.registerInitialTransfer(packageIdBytes, firstReceiver, type, { from: producer });
      await sut.registerTransfer(packageIdBytes, secondReceiver, transporter, { from: firstReceiver });
      // when
      await sut.registerTransfer(packageIdBytes, thirdReceiver, type, { from: secondReceiver });
      // then
      const packageAddress = await sut.getPackage(packageIdBytes);
      const actualPackage = await Package.at(packageAddress);

      const actualTransferCount = await actualPackage.getTransferCount();
      expect(actualTransferCount).to.be.a.bignumber.that.equals('3');

      const actualTransfer = await actualPackage.transferLog(2);
      expect(actualTransfer.from).to.equal(secondReceiver);
      expect(actualTransfer.to).to.equal(thirdReceiver);
      expect(actualTransfer.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);
      expect(actualTransfer.receiverType).to.be.a.bignumber.that.equals(`${type}`);
    });
  });

  it('should not allow registering transfer of an unknown package', async () => {
    // when
    const promise = sut.registerTransfer(packageIdBytes, secondReceiver, transporter, { from: firstReceiver });
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is unknown');
  });
});
