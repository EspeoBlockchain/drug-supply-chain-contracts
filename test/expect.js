/* globals web3 */

const chai = require('chai');

chai.use(require('chai-as-promised'));
chai.use(require('chai-bn')(web3.utils.BN));

// eslint-disable-next-line no-unused-vars
const { expect } = chai;

module.exports = expect;
