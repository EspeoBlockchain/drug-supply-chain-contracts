pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "./DrugItem.sol";

contract PurchasabilityValidator {

    uint8 public VALID_FOR_PURCHASE = 100;
    uint8 public NOT_IN_PHARMACY = 200;

    function isPurchasable(DrugItem _drugItem) public view returns (uint8[] memory result) {
        result = new uint8[](10); // TODO array size should be the maximum number of errors
        uint8 errorCount = 0;

        DrugItem.Handover memory lastHandover = _drugItem.getLastHandover();

        if (lastHandover.to.category != DrugItem.ParticipantCategory.Pharmacy) {
            result[errorCount] = NOT_IN_PHARMACY;
            errorCount++;
        }

        if (errorCount == 0) {
            result[0] = VALID_FOR_PURCHASE;
        }
    }
}