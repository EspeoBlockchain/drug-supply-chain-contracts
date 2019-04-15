pragma solidity 0.5.0;
pragma experimental ABIEncoderV2; // allows returning struct types

contract SupplyChain {

    struct Transfer {
        address from;
        address to;
        ReceiverType receiverType;
    }

    enum ReceiverType { Transporter, Pharmacy }

    mapping(bytes => Transfer[]) private packageLog;

    function getPackageTransferLog(bytes memory _packageId) public view returns (Transfer[] memory) {
        return packageLog[_packageId];
    }

    function registerInitialTransfer(bytes memory _packageId, address _to, ReceiverType _receiver)
        public
        notEmptyPackageId(_packageId)
        onlyNewPackage(_packageId)
    {
        // TODO consider creating a separate contract per package
        // which would store the log of its transfers
        packageLog[_packageId].push(Transfer(msg.sender, _to, _receiver));
    }

    modifier notEmptyPackageId(bytes memory _packageId) {
        require(_packageId.length > 0, "Given packageId is empty");
        _;
    }

    modifier onlyNewPackage(bytes memory _packageId) {
        require(packageLog[_packageId].length == 0, "Given packageId is already known");
        _;
    }
}