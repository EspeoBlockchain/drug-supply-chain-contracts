const { expect, participantTypes, transporterTypes } = require('./common');

const SupplyChain = artifacts.require('SupplyChain');
const Package = artifacts.require('Package');
const { hexToBytes, randomHex } = web3.utils;

contract('SupplyChain', async (accounts) => {
  const packageId = randomHex(32);
  const packageIdBytes = hexToBytes(packageId);
  const transporter = participantTypes.Transporter;
  const temperature = -20;
  const transporterType = transporterTypes.Truck;
  const producer = accounts[1];
  const firstParticipant = accounts[2];
  const secondParticipant = accounts[3];
  const thirdParticipant = accounts[4];

  let sut;

  beforeEach(async () => {
    // given
    sut = await SupplyChain.new();
    await sut.registerProducer(producer);
  });

  it('should register initial transfer from a producer', async () => {
    // when
    await sut.registerInitialTransfer(packageIdBytes, firstParticipant, transporter, { from: producer });
    // then
    const packageAddress = await sut.getPackage(packageIdBytes);
    const actual = await Package.at(packageAddress);
    await expect(actual.packageId()).to.eventually.equal(packageId);
  });

  it('should not allow registering same package twice', async () => {
    // given
    await sut.registerInitialTransfer(packageIdBytes, firstParticipant, transporter, { from: producer });
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, firstParticipant, transporter, { from: producer });
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is already known');
  });

  it('should not allow uknown producer to register an initial transfer', async () => {
    // when
    const promise = sut.registerInitialTransfer(packageIdBytes, firstParticipant, transporter, { from: accounts[9] });
    // then
    await expect(promise).to.be.rejectedWith('Transaction sender is an unknown producer');
  });

  Object.entries(participantTypes).forEach(([name, type]) => {
    it(`should register transfer from a transporter to a ${name}`, async () => {
      // given
      await sut.registerInitialTransfer(packageIdBytes, firstParticipant, type, { from: producer });
      // when
      await sut.registerTransfer(
        packageIdBytes,
        secondParticipant, type,
        temperature, transporterType,
        { from: firstParticipant },
      );
      // then
      const packageAddress = await sut.getPackage(packageIdBytes);
      const actualPackage = await Package.at(packageAddress);

      const actualTransferCount = await actualPackage.getTransferCount();
      expect(actualTransferCount).to.be.a.bignumber.that.equals('2');

      const actualTransfer = await actualPackage.transferLog(1);
      expect(actualTransfer.from).to.equal(firstParticipant);
      expect(actualTransfer.to).to.equal(secondParticipant);
      expect(actualTransfer.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);
      expect(actualTransfer.participantType).to.be.a.bignumber.that.equals(`${type}`);
      expect(actualTransfer.conditions.temperature).to.equal(`${temperature}`);
      expect(actualTransfer.conditions.transporterType).to.equal(`${transporterType}`);
    });

    it(`should register a subsequent transfer from a transporter to ${name}`, async () => {
      // given
      await sut.registerInitialTransfer(packageIdBytes, firstParticipant, type, { from: producer });
      await sut.registerTransfer(
        packageIdBytes,
        secondParticipant, transporter,
        temperature, transporterType,
        { from: firstParticipant },
      );
      const secondTemperature = -19;
      const secondTransporterType = transporterTypes.Airplane;
      // when
      await sut.registerTransfer(
        packageIdBytes,
        thirdParticipant, type,
        secondTemperature, secondTransporterType,
        { from: secondParticipant },
      );
      // then
      const packageAddress = await sut.getPackage(packageIdBytes);
      const actualPackage = await Package.at(packageAddress);

      const actualTransferCount = await actualPackage.getTransferCount();
      expect(actualTransferCount).to.be.a.bignumber.that.equals('3');

      const actualTransfer = await actualPackage.transferLog(2);
      expect(actualTransfer.from).to.equal(secondParticipant);
      expect(actualTransfer.to).to.equal(thirdParticipant);
      expect(actualTransfer.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);
      expect(actualTransfer.participantType).to.be.a.bignumber.that.equals(`${type}`);
      expect(actualTransfer.conditions.temperature).to.equal(`${secondTemperature}`);
      expect(actualTransfer.conditions.transporterType).to.equal(`${secondTransporterType}`);
    });
  });

  it('should not allow registering transfer of an unknown package', async () => {
    // when
    const promise = sut.registerTransfer(
      packageIdBytes,
      secondParticipant, transporter,
      temperature, transporterType,
      { from: firstParticipant },
    );
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is unknown');
  });
});
