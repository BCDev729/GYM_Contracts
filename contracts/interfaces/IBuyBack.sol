// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IBuyBack {
    function buyAndBurnToken(
        address,
        uint256,
        address,
        uint256,
        uint256
    ) external returns (uint256);
}
