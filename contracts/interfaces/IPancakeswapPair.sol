// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

interface IPancakeswapPair {
    function balanceOf(address owner) external view returns (uint256);

    function token0() external view returns (address);

    function token1() external view returns (address);
}
