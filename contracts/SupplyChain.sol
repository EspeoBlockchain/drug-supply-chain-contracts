pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "./interfaces/IDrugItem.sol";
import "./interfaces/ISupplyChain.sol";
import "./interfaces/IPurchasabilityValidator.sol";
import "./DrugItem.sol";
import "./PurchasabilityValidator.sol";
import "./VendorsManager.sol";


contract SupplyChain is ISupplyChain, VendorsManager {

    IPurchasabilityValidator private _validator;

    constructor() public {
        _validator = new PurchasabilityValidator();
    }

    function getDrugItem(bytes32 _drugItemId) public view returns (IDrugItem) {
        // TODO
    }

    function registerInitialHandover(
        bytes32 _drugItemId,
        address _to,
        IDrugItem.ParticipantCategory _participantCategory
    )
        public
        onlyNewDrugItem(_drugItemId)
        onlyKnownVendor
    {
        // TODO
    }

    function registerHandover(
        bytes32 _drugItemId,
        address _to,
        IDrugItem.ParticipantCategory _participantCategory,
        int8 _temperature,
        IDrugItem.TransitCategory _transitCategory
    )
        public
        onlyKnownDrugItem(_drugItemId)
    {
        // TODO
    }

    function isPurchasable(bytes32 _drugItemId)
        public
        view
        onlyKnownDrugItem(_drugItemId)
        returns (uint8[] memory)
    {
        // TODO
    }

    modifier onlyNewDrugItem(bytes32 _drugItemId) {
        // TODO
        _;
    }

    modifier onlyKnownDrugItem(bytes32 _drugItemId) {
        // TODO
        _;
    }
}
