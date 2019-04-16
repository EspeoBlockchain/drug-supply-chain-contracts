const chai = require('chai');

chai.use(require('chai-as-promised'));
chai.use(require('chai-bn')(web3.utils.BN));

const { expect } = chai;

module.exports = expect;
