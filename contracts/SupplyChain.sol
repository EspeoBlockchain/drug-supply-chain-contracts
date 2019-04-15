pragma solidity 0.5.0;
pragma experimental ABIEncoderV2; // allows returning struct types

contract SupplyChain {

    struct PackageInfo {
        bytes packageId;
        address from;
        address to;
    }

    mapping(bytes => PackageInfo) private packageLog;

    function registerInitialTransfer(bytes memory _packageId, address _to) public {
        packageLog[_packageId] = PackageInfo(_packageId, msg.sender, _to);
    }

    function getPackageInfo(bytes memory _packageId) public view returns (PackageInfo memory) {
        return packageLog[_packageId];
    }
}