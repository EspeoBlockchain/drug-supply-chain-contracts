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
  },
};
