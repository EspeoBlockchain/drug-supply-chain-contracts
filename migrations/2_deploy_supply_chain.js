const SupplyChain = artifacts.require('SupplyChain');

module.exports = (deployer) => {
  deployer.deploy(SupplyChain);
};
