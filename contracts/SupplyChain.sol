pragma solidity 0.5.0;
pragma experimental ABIEncoderV2; // allows returning struct types

contract SupplyChain {

    struct PackageInfo {
        bytes packageId;
        address from;
        address to;
        ReceiverType receiverType;
    }

    enum ReceiverType { Transporter, Pharmacy }

    mapping(bytes => PackageInfo) private packageLog;

    function registerInitialTransfer(bytes memory _packageId, address _to, ReceiverType _receiver) public {
        packageLog[_packageId] = PackageInfo(_packageId, msg.sender, _to, _receiver);
    }

    function getPackageInfo(bytes memory _packageId) public view returns (PackageInfo memory) {
        return packageLog[_packageId];
    }
}