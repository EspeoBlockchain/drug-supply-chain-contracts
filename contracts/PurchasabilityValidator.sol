pragma solidity 0.5.7;

import "./DrugItem.sol";

contract PurchasabilityValidator {

    uint8 public VALID_FOR_PURCHASE = 100;

    function isPurchasable(DrugItem _drugItem) public view returns (uint8[] memory result) {
        result = new uint8[](10); // TODO array size should be the maximum number of errors
        result[0] = VALID_FOR_PURCHASE;
    }
}