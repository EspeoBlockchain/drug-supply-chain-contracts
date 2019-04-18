pragma solidity 0.5.7;

import "./DrugItem.sol";
import "./VendorsManager.sol";


contract SupplyChain is VendorsManager {

    mapping(bytes => DrugItem) private items;

    function getDrugItem(bytes memory _drugItemId) public view returns (DrugItem) {
        return items[_drugItemId];
    }

    function registerInitialTransfer(bytes memory _drugItemId, address _to, DrugItem.ParticipantType _participant)
        public
        onlyNewDrugItem(_drugItemId)
        onlyKnownVendor
    {
        items[_drugItemId] = new DrugItem(_drugItemId, msg.sender, _to, _participant);
    }

    function registerTransfer(
        bytes memory _drugItemId,
        address _to,
        DrugItem.ParticipantType _participant,
        int8 _temperature,
        DrugItem.TransporterType _transporter
    )
        public
        onlyKnownDrugItem(_drugItemId)
    {
        items[_drugItemId].logTransfer(msg.sender, _to, _participant, _temperature, _transporter);
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
