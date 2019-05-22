pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/IDrugItem.sol";


contract DrugItem is IDrugItem, Ownable {

    bytes32 private drugItemId;
    address private vendor;
    Handover[] private handoverLog;
    mapping(bytes32 => TransitConditions) private transitConditionsLog;

    constructor(bytes32 _drugItemId, address _vendor, address _to, ParticipantCategory _participantCategory)
        public
        notEmptyDrugItemId(_drugItemId)
    {
        drugItemId = _drugItemId;
        vendor = _vendor;
        logHandover(_vendor, _to, _participantCategory);
    }

    function getHandover(uint index) public view returns (Handover memory) {
        return handoverLog[index];
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
        onlyOwner
    {
        require(_participantCategory != ParticipantCategory.Vendor, "Drug item can't be handed over to a vendor");
        require(handoverLog.length == 0 || getLastHandover().to.id == _from, "Handover must be done by the current drug item holder");
        require(
            handoverLog.length < 2 ||
                getLastHandover().to.category != ParticipantCategory.Carrier ||
                hasTransitConditionsForLastHandover(),
            "Transit conditions must be logged before next handover"
        );
        handoverLog.push(Handover(Participant(_to, _participantCategory), now));
    }

    function logTransitConditions(address _from, address _to, uint _when, int8 _temperature, TransitCategory _transitCategory)
        public
        onlyOwner
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

    function getDrugItemId() public view returns (bytes32) {
        return drugItemId;
    }

    function getVendor() public view returns (address) {
        return vendor;
    }

    function getTransitConditionsKey(address _from, address _to, uint _when) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(_from, _to, _when));
    }

    function hasTransitConditionsForLastHandover() private view returns (bool) {
        address from = handoverLog[handoverLog.length - 2].to.id;
        address to = getLastHandover().to.id;
        uint when = getLastHandover().when;
        return getTransitConditions(from, to, when).category != TransitCategory.NotApplicable;
    }

    modifier notEmptyDrugItemId(bytes32 _drugItemId) {
        require(_drugItemId != 0, "Given drugItemId is empty");
        _;
    }
}
