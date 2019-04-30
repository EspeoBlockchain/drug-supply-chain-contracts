/* eslint-disable import/no-extraneous-dependencies */
require('dotenv').config();
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    ropsten: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        process.env.ROPSTEN_PROVIDER_URL,
      ),
      network_id: '3',
    },
    ganache: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*', // match any network
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
