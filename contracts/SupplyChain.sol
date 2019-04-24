pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "./DrugItem.sol";
import "./VendorsManager.sol";


contract SupplyChain is VendorsManager {

    mapping(bytes => DrugItem) private items;

    function getDrugItem(bytes memory _drugItemId) public view returns (DrugItem) {
        return items[_drugItemId];
    }

    function registerInitialHandover(
        bytes memory _drugItemId,
        address _to,
        DrugItem.ParticipantCategory _participantCategory
    )
        public
        onlyNewDrugItem(_drugItemId)
        onlyKnownVendor
    {
        items[_drugItemId] = new DrugItem(_drugItemId, msg.sender, _to, _participantCategory);
    }

    function registerHandover(
        bytes memory _drugItemId,
        address _to,
        DrugItem.ParticipantCategory _participantCategory,
        int8 _temperature,
        DrugItem.TransitCategory _transitCategory
    )
        public
        onlyKnownDrugItem(_drugItemId)
    {
        items[_drugItemId].logHandover(_to, _participantCategory);
        uint when = items[_drugItemId].getLastHandover().when;
        items[_drugItemId].logTransitConditions(msg.sender, _to, when, _temperature, _transitCategory);
    }

    modifier onlyNewDrugItem(bytes memory _drugItemId) {
        require(address(items[_drugItemId]) == address(0), "Given drug item is already known");
        _;
    }

    modifier onlyKnownDrugItem(bytes memory _drugItemId) {
        require(address(items[_drugItemId]) != address(0), "Given drug item is unknown");
        _;
    }
}
