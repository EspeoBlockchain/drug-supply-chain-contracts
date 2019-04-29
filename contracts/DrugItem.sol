pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/ownership/Secondary.sol";


contract DrugItem is Secondary {

    struct Handover {
        Participant to;
        uint when;
    }

    struct Participant {
        address id;
        ParticipantCategory category;
    }

    struct TransitConditions {
        int8 temperature;
        TransitCategory category;
    }

    enum ParticipantCategory { Vendor, Carrier, Pharmacy }
    enum TransitCategory { NotApplicable, Airplane, Ship, Truck }

    bytes32 public drugItemId;
    address public vendor;
    Handover[] public handoverLog;
    mapping(bytes32 => TransitConditions) private transitConditionsLog;

    constructor(bytes32 _drugItemId, address _vendor, address _to, ParticipantCategory _participantCategory)
        public
        notEmptyDrugItemId(_drugItemId)
    {
        drugItemId = _drugItemId;
        vendor = _vendor;
        logHandover(_vendor, _to, _participantCategory);
    }

    function getHandoverCount() public view returns (uint256) {
        return handoverLog.length;
    }

    function getLastHandover() public view returns (Handover memory) {
        return handoverLog[handoverLog.length - 1];
    }

    function logHandover(
        address _from,
        address _to,
        ParticipantCategory _participantCategory
    )
        public
        onlyPrimary
    {
        require(_participantCategory != ParticipantCategory.Vendor, "Drug item can't be handed over back to any vendor");
        require(handoverLog.length == 0 || getLastHandover().to.id == _from, "Handover must be done by the current drug item owner");
        handoverLog.push(Handover(Participant(_to, _participantCategory), now));
    }

    function logTransitConditions(address _from, address _to, uint _when, int8 _temperature, TransitCategory _transitCategory)
        public
        onlyPrimary
    {
        uint length = handoverLog.length;
        require(
            length > 1 &&
                handoverLog[length - 2].to.id == _from &&
                handoverLog[length - 1].to.id == _to &&
                handoverLog[length - 1].when == _when,
            "Transit conditions can be logged only for the last handover"
        );

        bytes32 key = getTransitConditionsKey(_from, _to, _when);
        transitConditionsLog[key] = TransitConditions(_temperature, _transitCategory);
    }

    function getTransitConditions(address _from, address _to, uint _when) public view returns (TransitConditions memory) {
        bytes32 key = getTransitConditionsKey(_from, _to, _when);
        return transitConditionsLog[key];
    }

    function getTransitConditionsKey(address _from, address _to, uint _when) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(_from, _to, _when));
    }

    modifier notEmptyDrugItemId(bytes32 _drugItemId) {
        require(_drugItemId != 0, "Given drugItemId is empty");
        _;
    }
}
