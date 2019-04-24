const expect = require('./expect');

const { toBN } = web3.utils;

module.exports = actual => ({
  toEqual: (expected) => {
    expect(actual).to.be.a.bignumber.that.equals(toBN(expected));
  },
});
