// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "./PriceConverter.sol";


error FundMe__NotOwner();

/** @title A contract for crowd funding
 *  @author Benjimin Ouvich
 *  @notice This contract is to demo a sample funding contract
 *  @dev This implements price feeds as our library
 */
contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;
  
    // State Variables! 
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;
    uint256 public constant MINIMUN_USD = 50 * 1e18;
    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner {
        if (msg.sender != i_owner) { revert FundMe__NotOwner(); }
        _;
    }
    
    constructor(address priceFeedAddress){
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // receive() external payable {
    //     fund();
    // }


    // fallback() external payable {
    //     fund();
    // }

    /** 
     *  @notice This contract funds this contract
     *  @dev This implements price feeds as our library
     */
    function fund() public payable {
        // set minimum Usd
        // send ETh
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUN_USD,
            "Didn't send enough!"
        );
        // 18 decimals
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }
    
    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns(address) {
        return i_owner;
    }

    function getFunders(uint index) public view returns(address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funders) public view returns(uint) {
        return s_addressToAmountFunded[funders];
    }

    function getPriceFeed() public view returns(AggregatorV3Interface) {
        return s_priceFeed;
    }
}
