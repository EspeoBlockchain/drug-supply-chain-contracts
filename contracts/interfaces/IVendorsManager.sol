pragma solidity 0.5.7;


contract IVendorsManager {

    // invokable only by the owner
    function registerVendor(address _vendor) public;

    // invokable only by the owner
    function deregisterVendor(address _vendor) public;

    function isVendor(address _vendor) public view returns (bool);
}
