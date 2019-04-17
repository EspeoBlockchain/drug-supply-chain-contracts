pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/ownership/Secondary.sol";


contract Package is Secondary {

    struct Transfer {
        address from;
        address to;
        uint when;
        ParticipantType participantType;
    }

    enum ParticipantType { Transporter, Pharmacy }

    bytes public packageId;
    address public producer;
    Transfer[] public transferLog;

    constructor(bytes memory _packageId, address _producer, address _to, ParticipantType _participantType)
        public
        notEmptyPackageId(_packageId)
    {
        packageId = _packageId;
        producer = _producer;
        logTransfer(_producer, _to, _participantType);
    }

    function getTransferCount() public view returns (uint256) {
        return transferLog.length;
    }

    function logTransfer(address _from, address _to, ParticipantType _participantType)
        public
        onlyPrimary
    {
        // solium-disable-next-line security/no-block-members
        transferLog.push(Transfer(_from, _to, now, _participantType));
    }

    modifier notEmptyPackageId(bytes memory _packageId) {
        require(_packageId.length > 0, "Given packageId is empty");
        _;
    }
}
