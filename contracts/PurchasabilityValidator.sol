pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "./DrugItem.sol";


contract PurchasabilityValidator {

    uint8 public VALID_FOR_PURCHASE = 100;
    uint8 public NOT_IN_PHARMACY = 200;
    uint8 public TOO_MANY_HANDOVERS = 201;
    uint8 public TEMPERATURE_TOO_HIGH = 202;
    uint8 public TEMPERATURE_TOO_LOW = 203;
    uint8 public TOTAL_TRANSIT_DURATION_TOO_LONG = 204;
    uint8 public SINGLE_TRANSIT_DURATION_TOO_LONG = 205;

    function isPurchasable(DrugItem _drugItem) public view returns (uint8[] memory result) {
        result = new uint8[](0);

        DrugItem.Handover memory lastHandover = _drugItem.getLastHandover();
        uint handoverCount = _drugItem.getHandoverCount();

        result = appendErrorCode(result, checkLocation(lastHandover));
        result = appendErrorCode(result, checkHandoverCount(handoverCount));

        for (uint8 i = 1; i < handoverCount; i++) {
            DrugItem.Handover memory previousHandover = _drugItem.getHandover(i - 1);

            DrugItem.Handover memory handover = _drugItem.getHandover(i);
            DrugItem.TransitConditions memory conditions = _drugItem.getTransitConditions(
                previousHandover.to.id,
                handover.to.id,
                handover.when
            );

            result = appendErrorCode(result, checkUpperTemperatureLimit(conditions));
            result = appendErrorCode(result, checkLowerTemperatureLimit(conditions));

            uint singleTransitDuration = handover.when - previousHandover.when;
            result = appendErrorCode(result, checkSingleTransitDuration(conditions, singleTransitDuration));
        }

        DrugItem.Handover memory initialHandover = _drugItem.getHandover(0);
        uint totalTransitDuration = lastHandover.when - initialHandover.when;
        result = appendErrorCode(result, checkTotalTransitDuration(totalTransitDuration));

        // nothing wrong was found with the item - return success code
        if (result.length == 0) {
            result = appendErrorCode(result, VALID_FOR_PURCHASE);
        }
    }

    function checkLocation(DrugItem.Handover memory lastHandover) private view returns (uint8 errorCode) {
        if (lastHandover.to.category != DrugItem.ParticipantCategory.Pharmacy) {
            errorCode = NOT_IN_PHARMACY;
        }
    }

    function checkHandoverCount(uint handoverCount) private view returns (uint8 errorCode) {
        if (handoverCount > 4) {
            errorCode = TOO_MANY_HANDOVERS;
        }
    }

    function checkUpperTemperatureLimit(DrugItem.TransitConditions memory conditions) private view returns (uint8 errorCode) {
        if (
            (conditions.category == DrugItem.TransitCategory.Ship && conditions.temperature > -18) ||
            (conditions.category == DrugItem.TransitCategory.Truck && conditions.temperature > -18) ||
            (conditions.category == DrugItem.TransitCategory.Airplane && conditions.temperature > -10)
        ) {
            errorCode = TEMPERATURE_TOO_HIGH;
        }
    }

    function checkLowerTemperatureLimit(DrugItem.TransitConditions memory conditions) private view returns (uint8 errorCode) {
        if (conditions.temperature < -22) {
            errorCode = TEMPERATURE_TOO_LOW;
        }
    }

    function checkSingleTransitDuration(
        DrugItem.TransitConditions memory conditions,
        uint transitDuration
    )
        private view returns (uint8 errorCode)
    {
        if (
            (conditions.category == DrugItem.TransitCategory.Ship && transitDuration > 4 days) ||
            (conditions.category == DrugItem.TransitCategory.Truck && transitDuration > 4 days) ||
            (conditions.category == DrugItem.TransitCategory.Airplane && transitDuration > 1 days)
        ) {
            errorCode = SINGLE_TRANSIT_DURATION_TOO_LONG;
        }
    }

    function checkTotalTransitDuration(uint transitDuration) private view returns (uint8 errorCode) {
        if (transitDuration > 8 days) {
            errorCode = TOTAL_TRANSIT_DURATION_TOO_LONG;
        }
    }

    function appendErrorCode(uint8[] memory codes, uint8 code) private pure returns (uint8[] memory) {
        if (code > 0) {
            uint8[] memory result = new uint8[](codes.length + 1);
            for (uint8 i = 0; i < codes.length; i++) {
                result[i] = codes[i];
            }
            result[codes.length] = code;
            return result;
        } else {
            return codes;
        }
    }
}