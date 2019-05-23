pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/IVendorsManager.sol";


contract VendorsManager is IVendorsManager, Ownable {

    function registerVendor(address _vendor) public {
        // TODO
    }

    function deregisterVendor(address _vendor) public {
        // TODO
    }

    function isVendor(address _vendor) public view returns (bool) {
        // TODO
    }

    modifier onlyKnownVendor() {
        // TODO
        _;
    }
}
