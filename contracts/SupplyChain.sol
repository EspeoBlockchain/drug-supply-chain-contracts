pragma solidity 0.5.7;

import "./Package.sol";
import "./ProducersManager.sol";


contract SupplyChain is ProducersManager {

    mapping(bytes => Package) private packages;

    function getPackage(bytes memory _packageId) public view returns (Package) {
        return packages[_packageId];
    }

    function registerInitialTransfer(bytes memory _packageId, address _to, Package.ParticipantType _participant)
        public
        onlyNewPackage(_packageId)
        onlyKnownProducer
    {
        packages[_packageId] = new Package(_packageId, msg.sender, _to, _participant);
    }

    function registerTransfer(bytes memory _packageId, address _to, Package.ParticipantType _participant)
        public
        onlyKnownPackage(_packageId)
    {
        packages[_packageId].logTransfer(msg.sender, _to, _participant);
    }

    modifier onlyNewPackage(bytes memory _packageId) {
        require(address(packages[_packageId]) == address(0), "Given packageId is already known");
        _;
    }

    modifier onlyKnownPackage(bytes memory _packageId) {
        require(address(packages[_packageId]) != address(0), "Given packageId is unknown");
        _;
    }
}
