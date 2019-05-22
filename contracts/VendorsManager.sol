pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./interfaces/IVendorsManager.sol";


contract VendorsManager is IVendorsManager, Ownable {

    mapping(address => bool) private vendors;

    function registerVendor(address _vendor) public onlyOwner {
        vendors[_vendor] = true;
    }

    function deregisterVendor(address _vendor) public onlyOwner {
        vendors[_vendor] = false;
    }

    function isVendor(address _vendor) public view returns (bool) {
        return vendors[_vendor];
    }

    modifier onlyKnownVendor() {
        require(vendors[msg.sender], "Transaction sender is an unknown vendor");
        _;
    }
}
