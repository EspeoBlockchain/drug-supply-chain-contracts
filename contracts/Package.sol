pragma solidity 0.5.0;

contract Package {

    struct Transfer {
        address from;
        address to;
        ReceiverType receiverType;
    }

    enum ReceiverType { Transporter, Pharmacy }

    address public owner;

    bytes public packageId;
    address public producer;
    Transfer[] public transferLog;

    constructor(bytes memory _packageId, address _producer, address _receiver, ReceiverType _receiverType)
        public
        notEmptyPackageId(_packageId)
    {
        owner = msg.sender;
        packageId = _packageId;
        producer = _producer;
        logTransfer(_producer, _receiver, _receiverType);
    }

    function logTransfer(address _from, address _to, ReceiverType _receiverType) public {
        transferLog.push(Transfer(_from, _to, _receiverType));
    }

    modifier notEmptyPackageId(bytes memory _packageId) {
        require(_packageId.length > 0, "Given packageId is empty");
        _;
    }
}