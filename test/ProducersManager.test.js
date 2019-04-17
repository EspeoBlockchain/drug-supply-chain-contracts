const { expect } = require('./common');

const ProducersManager = artifacts.require('ProducersManager');

contract('ProducersManager', async (accounts) => {
  const producer = accounts[1];

  let sut;

  beforeEach(async () => {
    // given
    sut = await ProducersManager.new();
  });

  it('should be owned by the creator', async () => {
    // then
    const actualOwner = await sut.owner();
    expect(actualOwner).to.equal(accounts[0]);
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
