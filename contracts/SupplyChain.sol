pragma solidity 0.5.0;

contract SupplyChain {

    mapping(bytes => bool) private packageLog;

    function registerInitialTransfer(bytes memory _packageId, address _to) public {
        packageLog[_packageId] = true;
    }

    function getPackageInfo(bytes memory _packageId) public view returns (bool) {
        return packageLog[_packageId];
    }
}