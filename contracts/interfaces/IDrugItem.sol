pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;


contract IDrugItem {

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

    // invokable only by the contract creator
    function logHandover(address _from, address _to, ParticipantCategory _participantCategory) public;

    // invokable only by the contract creator
    function logTransitConditions(
        address _from,
        address _to,
        uint _when,
        int8 _temperature,
        TransitCategory _transitCategory
    )
        public;

    function getHandover(uint index) public view returns (Handover memory);

    function getHandoverCount() public view returns (uint256);

    function getLastHandover() public view returns (Handover memory);

    function getTransitConditions(address _from, address _to, uint _when) public view returns (TransitConditions memory);

    function getDrugItemId() public view returns (bytes32);

    function getVendor() public view returns (address);
}
