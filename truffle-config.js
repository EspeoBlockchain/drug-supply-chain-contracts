/* eslint-disable import/no-extraneous-dependencies */
require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    ropsten: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY || process.env.MNEMONIC,
        process.env.ROPSTEN_PROVIDER_URL,
      ),
      network_id: '3',
    },
  },
  compilers: {
    solc: {
      version: '0.5.7',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
