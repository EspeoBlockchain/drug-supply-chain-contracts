pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Package.sol";


contract SupplyChain is Ownable {

    mapping(bytes => Package) private packages;

    function getPackage(bytes memory _packageId) public view returns (Package) {
        return packages[_packageId];
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
