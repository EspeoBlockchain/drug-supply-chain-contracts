web3.extend({
  property: 'evm',
  methods: [{
    name: 'mine',
    call: 'evm_mine',
    params: 0,
  }],
});

web3.extend({
  property: 'evm',
  methods: [{
    name: 'increaseTime',
    call: 'evm_increaseTime',
    params: 1,
  }],
});
