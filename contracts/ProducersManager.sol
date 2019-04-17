pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract ProducersManager is Ownable {

    mapping(address => bool) private producers;

    function registerProducer(address _producer) public onlyOwner {
        producers[_producer] = true;
    }

    function deregisterProducer(address _producer) public onlyOwner {
        producers[_producer] = false;
    }

    function isProducer(address _producer) public view returns (bool) {
        return producers[_producer];
    }

    modifier onlyKnownProducer() {
        require(producers[msg.sender], "Transaction sender is an unknown producer");
        _;
    }
}
