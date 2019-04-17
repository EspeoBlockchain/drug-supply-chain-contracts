const { expect, participantTypes } = require('./common');

const Package = artifacts.require('Package');
const { hexToBytes, randomHex } = web3.utils;

contract('Package', async (accounts) => {
  const packageId = randomHex(32);
  const packageIdBytes = hexToBytes(packageId);
  const participantType = participantTypes.Transporter;
  const producer = accounts[1];
  const participant = accounts[2];

  it('should set the creator as the primary', async () => {
    // when
    const sut = await Package.new(packageIdBytes, producer, participant, participantType);
    // then
    const actualPrimary = await sut.primary();
    expect(actualPrimary).to.equal(accounts[0]);
  });

  it('should create a package and register initial transfer', async () => {
    // when
    const actual = await Package.new(packageIdBytes, producer, participant, participantType);
    // then
    await expect(actual.packageId()).to.eventually.equal(packageId);
    await expect(actual.producer()).to.eventually.equal(producer);
    await expect(actual.primary()).to.eventually.equal(accounts[0]);

    const actualTransferCount = await actual.getTransferCount();
    expect(actualTransferCount).to.be.a.bignumber.that.equals('1');
    const actualTransfer = await actual.transferLog(0);
    expect(actualTransfer.from).to.equal(producer);
    expect(actualTransfer.to).to.equal(participant);
    expect(actualTransfer.when).to.be.a.bignumber.that.equals(`${(await web3.eth.getBlock('latest')).timestamp}`);
    expect(actualTransfer.participantType).to.be.a.bignumber.that.equals(`${participantType}`);
  });

  Object.entries(participantTypes).forEach(([name, type]) => {
    it(`should allow ${name} participant type`, async () => {
      // when
      const actual = await Package.new(packageIdBytes, producer, participant, type);
      // then
      const { participantType: actualType } = (await actual.transferLog(0));
      expect(actualType).to.be.a.bignumber.that.equals(`${type}`);
    });
  });

  it('should not allow unknown participant type when creating package', async () => {
    // when
    const promise = Package.new(packageIdBytes, producer, participant, 99);
    // then
    await expect(promise).to.be.rejected;
  });

  it('should not allow empty id when creating package', async () => {
    // when
    const promise = Package.new([], producer, participant, participantType);
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is empty');
  });

  it('should register next transfer', async () => {
    // given
    const sut = await Package.new(packageIdBytes, producer, participant, participantType);
    const from = participant;
    const to = accounts[3];
    // when
    await sut.logTransfer(from, to, participantType);
    // then
    const actualTransferCount = await sut.getTransferCount();
    expect(actualTransferCount).to.be.a.bignumber.that.equals('2');
    const actualTransfer = await sut.transferLog(1);
    expect(actualTransfer.from).to.equal(from);
    expect(actualTransfer.to).to.equal(to);
    expect(actualTransfer.participantType).to.be.a.bignumber.that.equals(`${participantType}`);
  });

  it('should not allow non-owner to register next transfers', async () => {
    // given
    const sut = await Package.new(packageIdBytes, producer, participant, participantType);
    const from = participant;
    const to = accounts[3];
    // when
    const promise = sut.logTransfer(from, to, participantType, { from: accounts[9] });
    // then
    await expect(promise).to.be.rejected;
  });
});
