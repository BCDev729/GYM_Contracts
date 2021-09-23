// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

interface IGymMLM {
    function isOnGymMLM(address) external view returns (bool);

    function addGymMLM(address, uint256) external;

    function distributeRewards(
        uint256,
        address,
        address
    ) external;
}
