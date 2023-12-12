// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed) internal view returns(uint) {
        (,int price,,,) = priceFeed.latestRoundData();
        // ETH in USD
        // 8 decimals
        return uint(price * 1e10); // turn into 18 decimals
    }

    function getConversionRate(uint ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint) {
        uint ethPrice = getPrice(priceFeed);
        uint ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}