/* globals artifacts, contract, it, web3 */

const expect = require('./expect');

const Package = artifacts.require('Package');
const { hexToBytes, randomHex } = web3.utils;

contract('Package', async (accounts) => {
  const packageId = randomHex(32);
  const packageIdBytes = hexToBytes(packageId);
  const receiverType = 0; // Transporter
  const producer = accounts[1];
  const receiver = accounts[2];

  it('should create a package and register initial transfer', async () => {
    // when
    const actual = await Package.new(packageIdBytes, producer, receiver, receiverType);
    // then
    await expect(actual.packageId()).to.eventually.equal(packageId);
    await expect(actual.producer()).to.eventually.equal(producer);
    await expect(actual.owner()).to.eventually.equal(accounts[0]);

    const actualTransfer = await actual.transferLog.call(0);
    expect(actualTransfer.to).to.equal(receiver);
    expect(actualTransfer.from).to.equal(producer);
    expect(actualTransfer.receiverType).to.be.a.bignumber.that.equals(`${receiverType}`);
  });

  ['Transporter', 'Pharmacy'].forEach((name, type) => {
    it(`should allow ${name} receiver type`, async () => {
      // when
      const actual = await Package.new(packageIdBytes, producer, receiver, type);
      // then
      const { receiverType: actualType } = (await actual.transferLog.call(0));
      expect(actualType).to.be.a.bignumber.that.equals(`${type}`);
    });
  });

  it('should not allow unknown receiver type when creating package', async () => {
    // when
    const promise = Package.new(packageIdBytes, producer, receiver, 99);
    // then
    await expect(promise).to.be.rejected;
  });

  it('should not allow empty id when creating package', async () => {
    // when
    const promise = Package.new([], producer, receiver, receiverType);
    // then
    await expect(promise).to.be.rejectedWith('Given packageId is empty');
  });
});
