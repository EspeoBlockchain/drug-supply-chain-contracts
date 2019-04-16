module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    artifacts: 'readonly',
    beforeEach: 'readonly',
    contract: 'readonly',
    it: 'readonly',
    web3: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  plugins: ['chai-friendly'],
  overrides: [{
    files: 'test/*.test.js',
    rules: {
      'no-unused-expressions': 'off',
      'chai-friendly/no-unused-expressions': 'error',
    },
  }],
  rules: {
    "max-len": ["error", { "code": 120 }]
  },
};
