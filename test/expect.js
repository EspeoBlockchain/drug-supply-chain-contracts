const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
// eslint-disable-next-line no-unused-vars
const { expect } = chai;

module.exports = expect;
