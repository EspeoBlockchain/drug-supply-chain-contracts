pragma solidity 0.5.7;

contract Package {

    struct Transfer {
        address from;
        address to;
        uint when;
        ReceiverType receiverType;
    }

    enum ReceiverType { Transporter, Pharmacy }

    address public creator;

    bytes public packageId;
    address public producer;
    Transfer[] public transferLog;

    constructor(bytes memory _packageId, address _producer, address _receiver, ReceiverType _receiverType)
        public
        notEmptyPackageId(_packageId)
    {
        creator = msg.sender;
        packageId = _packageId;
        producer = _producer;
        logTransfer(_producer, _receiver, _receiverType);
    }

    function getTransferCount() public view returns (uint256) {
        return transferLog.length;
    }

    function logTransfer(address _from, address _to, ReceiverType _receiverType)
        public
        onlyCreator
    {
        // solium-disable-next-line security/no-block-members
        transferLog.push(Transfer(_from, _to, now, _receiverType));
    }

    modifier notEmptyPackageId(bytes memory _packageId) {
        require(_packageId.length > 0, "Given packageId is empty");
        _;
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "This operation can only be performed by the contract creator");
        _;
    }
}
