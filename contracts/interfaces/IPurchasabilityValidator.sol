pragma solidity 0.5.7;

import "./IDrugItem.sol";


contract IPurchasabilityValidator {

    uint8 public VALID_FOR_PURCHASE = 100;
    uint8 public NOT_IN_PHARMACY = 200;
    uint8 public TOO_MANY_HANDOVERS = 201;
    uint8 public TEMPERATURE_TOO_HIGH = 202;
    uint8 public TEMPERATURE_TOO_LOW = 203;
    uint8 public TOTAL_TRANSIT_DURATION_TOO_LONG = 204;
    uint8 public SINGLE_TRANSIT_DURATION_TOO_LONG = 205;

    function isPurchasable(IDrugItem _drugItem) public view returns (uint8[] memory result);
}
