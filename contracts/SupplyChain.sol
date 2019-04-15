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

    function getPackageInfo(bytes memory _packageId) public view returns (PackageInfo memory) {
        return packageLog[_packageId];
    }

    function registerInitialTransfer(bytes memory _packageId, address _to, ReceiverType _receiver)
        public
        notEmptyPackageId(_packageId)
        onlyNewPackage(_packageId)
    {
        packageLog[_packageId] = PackageInfo(_packageId, msg.sender, _to, _receiver);
    }

    modifier notEmptyPackageId(bytes memory _packageId) {
        require(_packageId.length > 0, "Given packageId is empty");
        _;
    }

    modifier onlyNewPackage(bytes memory _packageId) {
        require(packageLog[_packageId].packageId.length == 0, "Given packageId is already known");
        _;
    }
}