pragma solidity 0.5.7;

import "./IDrugItem.sol";


contract ISupplyChain {

    function getDrugItem(bytes32 _drugItemId) public view returns (IDrugItem);

    // invokable only for new drug item ids
    // invokable only by known vendors
    function registerInitialHandover(
        bytes32 _drugItemId,
        address _to,
        IDrugItem.ParticipantCategory _participantCategory
    )
        public;

    // invokable only for known drug item ids
    function registerHandover(
        bytes32 _drugItemId,
        address _to,
        IDrugItem.ParticipantCategory _participantCategory,
        int8 _temperature,
        IDrugItem.TransitCategory _transitCategory
    )
        public;

    // invokable only for known drug item ids
    function isPurchasable(bytes32 _drugItemId) public view returns (uint8[] memory);
}
