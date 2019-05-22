pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "./DrugItem.sol";
import "./PurchasabilityValidator.sol";
import "./VendorsManager.sol";


contract SupplyChain is VendorsManager {

    mapping(bytes32 => DrugItem) private items;
    PurchasabilityValidator private _validator;

    constructor() public {
        _validator = new PurchasabilityValidator();
    }

    function getDrugItem(bytes32 _drugItemId) public view returns (DrugItem) {
        return items[_drugItemId];
    }

    function registerInitialHandover(
        bytes32 _drugItemId,
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
        bytes32 _drugItemId,
        address _to,
        DrugItem.ParticipantCategory _participantCategory,
        int8 _temperature,
        DrugItem.TransitCategory _transitCategory
    )
        public
        onlyKnownDrugItem(_drugItemId)
    {
        items[_drugItemId].logHandover(msg.sender, _to, _participantCategory);
        items[_drugItemId].logTransitConditions(msg.sender, _to, now, _temperature, _transitCategory);
    }

    function isPurchasable(bytes32 _drugItemId)
        public
        view
        onlyKnownDrugItem(_drugItemId)
        returns (uint8[] memory)
    {
        return _validator.isPurchasable(items[_drugItemId]);
    }

    modifier onlyNewDrugItem(bytes32 _drugItemId) {
        require(address(items[_drugItemId]) == address(0), "Given drug item is already known");
        _;
    }

    modifier onlyKnownDrugItem(bytes32 _drugItemId) {
        require(address(items[_drugItemId]) != address(0), "Given drug item is unknown");
        _;
    }
}
