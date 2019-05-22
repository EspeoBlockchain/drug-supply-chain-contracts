pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "./interfaces/IDrugItem.sol";
import "./interfaces/IPurchasabilityValidator.sol";


contract PurchasabilityValidator is IPurchasabilityValidator {

    function isPurchasable(IDrugItem _drugItem) public view returns (uint8[] memory result) {
        result = new uint8[](0);

        IDrugItem.Handover memory lastHandover = _drugItem.getLastHandover();
        uint handoverCount = _drugItem.getHandoverCount();

        result = appendErrorCode(result, checkLocation(lastHandover));
        result = appendErrorCode(result, checkHandoverCount(handoverCount));

        for (uint8 i = 1; i < handoverCount; i++) {
            IDrugItem.Handover memory previousHandover = _drugItem.getHandover(i - 1);

            IDrugItem.Handover memory handover = _drugItem.getHandover(i);
            IDrugItem.TransitConditions memory conditions = _drugItem.getTransitConditions(
                previousHandover.to.id,
                handover.to.id,
                handover.when
            );

            result = appendErrorCode(result, checkUpperTemperatureLimit(conditions));
            result = appendErrorCode(result, checkLowerTemperatureLimit(conditions));

            uint singleTransitDuration = handover.when - previousHandover.when;
            result = appendErrorCode(result, checkSingleTransitDuration(conditions, singleTransitDuration));
        }

        IDrugItem.Handover memory initialHandover = _drugItem.getHandover(0);
        uint totalTransitDuration = lastHandover.when - initialHandover.when;
        result = appendErrorCode(result, checkTotalTransitDuration(totalTransitDuration));

        // nothing wrong was found with the item - return success code
        if (result.length == 0) {
            result = appendErrorCode(result, VALID_FOR_PURCHASE);
        }
    }

    function checkLocation(IDrugItem.Handover memory lastHandover) private view returns (uint8 errorCode) {
        if (lastHandover.to.category != IDrugItem.ParticipantCategory.Pharmacy) {
            errorCode = NOT_IN_PHARMACY;
        }
    }

    function checkHandoverCount(uint handoverCount) private view returns (uint8 errorCode) {
        if (handoverCount > 4) {
            errorCode = TOO_MANY_HANDOVERS;
        }
    }

    function checkUpperTemperatureLimit(IDrugItem.TransitConditions memory conditions) private view returns (uint8 errorCode) {
        if (
            (conditions.category == IDrugItem.TransitCategory.Ship && conditions.temperature > -18) ||
            (conditions.category == IDrugItem.TransitCategory.Truck && conditions.temperature > -18) ||
            (conditions.category == IDrugItem.TransitCategory.Airplane && conditions.temperature > -10)
        ) {
            errorCode = TEMPERATURE_TOO_HIGH;
        }
    }

    function checkLowerTemperatureLimit(IDrugItem.TransitConditions memory conditions) private view returns (uint8 errorCode) {
        if (conditions.temperature < -22) {
            errorCode = TEMPERATURE_TOO_LOW;
        }
    }

    function checkSingleTransitDuration(
        IDrugItem.TransitConditions memory conditions,
        uint transitDuration
    )
        private view returns (uint8 errorCode)
    {
        if (
            (conditions.category == IDrugItem.TransitCategory.Ship && transitDuration > 4 days) ||
            (conditions.category == IDrugItem.TransitCategory.Truck && transitDuration > 4 days) ||
            (conditions.category == IDrugItem.TransitCategory.Airplane && transitDuration > 1 days)
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