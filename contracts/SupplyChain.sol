pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Package.sol";


contract SupplyChain is Ownable {

    mapping(bytes => Package) private packages;
    mapping(address => bool) private producers;

    function getPackage(bytes memory _packageId) public view returns (Package) {
        return packages[_packageId];
    }

    function registerProducer(address _producer) public onlyOwner {
        producers[_producer] = true;
    }

    function deregisterProducer(address _producer) public onlyOwner {
        producers[_producer] = false;
    }

    function isProducer(address _producer) public view returns (bool) {
        return producers[_producer];
    }

    function registerInitialTransfer(bytes memory _packageId, address _to, Package.ReceiverType _receiver)
        public
        onlyNewPackage(_packageId)
    {
        packages[_packageId] = new Package(_packageId, msg.sender, _to, _receiver);
    }

    modifier onlyNewPackage(bytes memory _packageId) {
        require(address(packages[_packageId]) == address(0), "Given packageId is already known");
        _;
    }
}
