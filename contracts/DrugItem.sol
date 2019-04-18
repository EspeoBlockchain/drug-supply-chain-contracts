pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/ownership/Secondary.sol";


contract DrugItem is Secondary {

    struct TransporterConditions {
        int8 temperature;
        TransporterType transporterType;
    }

    struct Transfer {
        address from;
        address to;
        uint when;
        ParticipantType participantType;
        TransporterConditions conditions;
    }

    enum ParticipantType { Transporter, Pharmacy }
    enum TransporterType { Airplane, Ship, Truck, None }

    bytes public drugItemId;
    address public producer;
    Transfer[] public transferLog;

    constructor(bytes memory _drugItemId, address _producer, address _to, ParticipantType _participantType)
        public
        notEmptyDrugItemId(_drugItemId)
    {
        drugItemId = _drugItemId;
        producer = _producer;
        logTransfer(_producer, _to, _participantType, 0, TransporterType.None);
    }

    function getTransferCount() public view returns (uint256) {
        return transferLog.length;
    }

    function logTransfer(
        address _from,
        address _to,
        ParticipantType _participantType,
        int8 _temperature,
        TransporterType _transporterType
    )
        public
        onlyPrimary
    {
        // solium-disable-next-line security/no-block-members
        transferLog.push(Transfer(_from, _to, now, _participantType, TransporterConditions(_temperature, _transporterType)));
    }

    modifier notEmptyDrugItemId(bytes memory _drugItemId) {
        require(_drugItemId.length > 0, "Given drugItemId is empty");
        _;
    }
}
