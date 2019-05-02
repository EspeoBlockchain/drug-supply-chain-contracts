pragma solidity 0.5.7;
pragma experimental ABIEncoderV2;

import "./DrugItem.sol";

contract PurchasabilityValidator {

    uint8 public VALID_FOR_PURCHASE = 100;
    uint8 public NOT_IN_PHARMACY = 200;
    uint8 public TOO_MANY_HANDOVERS = 201;
    uint8 public TEMPERATURE_TOO_HIGH = 202;
    uint8 public TEMPERATURE_TOO_LOW = 203;
    uint8 public TOTAL_TRANSIT_TIME_TOO_LONG = 204;

    function isPurchasable(DrugItem _drugItem) public view returns (uint8[] memory result) {
        result = new uint8[](10); // TODO array size should be the maximum number of errors
        uint8 errorCount = 0;

        DrugItem.Handover memory lastHandover = _drugItem.getLastHandover();
        uint handoverCount = _drugItem.getHandoverCount();

        if (lastHandover.to.category != DrugItem.ParticipantCategory.Pharmacy) {
            result[errorCount] = NOT_IN_PHARMACY;
            errorCount++;
        }

        if (handoverCount > 4) {
            result[errorCount] = TOO_MANY_HANDOVERS;
            errorCount++;
        }

        for (uint8 i = 1; i < handoverCount; i++) {
            (DrugItem.Participant memory previous, ) = _drugItem.handoverLog(i - 1);
            address from = previous.id;
            (DrugItem.Participant memory to, uint when) = _drugItem.handoverLog(i);

            DrugItem.TransitConditions memory conditions = _drugItem.getTransitConditions(from, to.id, when);

            if (
                (conditions.category == DrugItem.TransitCategory.Ship && conditions.temperature > -18) ||
                (conditions.category == DrugItem.TransitCategory.Truck && conditions.temperature > -18) ||
                (conditions.category == DrugItem.TransitCategory.Airplane && conditions.temperature > -10)
            ) {
                result[errorCount] = TEMPERATURE_TOO_HIGH;
                errorCount++;
            }

            if (conditions.temperature < -22) {
                result[errorCount] = TEMPERATURE_TOO_LOW;
                errorCount++;
            }
        }

        (, uint start) = _drugItem.handoverLog(0);
        uint stop = _drugItem.getLastHandover().when;
        if (stop - start > 8 days) {
            result[errorCount] = TOTAL_TRANSIT_TIME_TOO_LONG;
            errorCount++;
        }

        if (errorCount == 0) {
            result[0] = VALID_FOR_PURCHASE;
        }
    }
}