pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/ownership/Secondary.sol";


contract Package is Secondary {

    struct Transfer {
        address from;
        address to;
        uint when;
        ReceiverType receiverType;
    }

    enum ReceiverType { Transporter, Pharmacy }

    bytes public packageId;
    address public producer;
    Transfer[] public transferLog;

    constructor(bytes memory _packageId, address _producer, address _receiver, ReceiverType _receiverType)
        public
        notEmptyPackageId(_packageId)
    {
        packageId = _packageId;
        producer = _producer;
        logTransfer(_producer, _receiver, _receiverType);
    }

    function getTransferCount() public view returns (uint256) {
        return transferLog.length;
    }

    function logTransfer(address _from, address _to, ReceiverType _receiverType)
        public
        onlyPrimary
    {
        // solium-disable-next-line security/no-block-members
        transferLog.push(Transfer(_from, _to, now, _receiverType));
    }

    modifier notEmptyPackageId(bytes memory _packageId) {
        require(_packageId.length > 0, "Given packageId is empty");
        _;
    }
}
