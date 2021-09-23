// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./IPancakeswapPair.sol";
import "./IPancakeRouter02.sol";

interface ILiquidityProvider {
    function apis(uint256)
        external
        view
        returns (
            address,
            address,
            address
        );

    function addExchange(IPancakeRouter02) external;

    function addLiquidityETH(
        address,
        address,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ) external payable returns (uint256);

    function addLiquidityETHByPair(
        IPancakeswapPair,
        address,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ) external payable returns (uint256);

    function addLiquidity(
        address,
        address,
        uint256,
        uint256,
        uint256,
        uint256,
        address,
        uint256,
        uint256
    ) external payable returns (uint256);

    function addLiquidityByPair(
        IPancakeswapPair,
        uint256,
        uint256,
        uint256,
        uint256,
        address,
        uint256,
        uint256
    ) external payable returns (uint256);

    function removeLiquidityETH(
        address,
        uint256,
        uint256,
        uint256,
        uint256,
        address,
        uint256,
        uint256,
        uint8
    ) external returns (uint256[3] memory);

    function removeLiquidityETHByPair(
        IPancakeswapPair,
        uint256,
        uint256,
        uint256,
        uint256,
        address,
        uint256,
        uint256,
        uint8
    ) external returns (uint256[3] memory);

    function removeLiquidityETHWithPermit(
        address,
        uint256,
        uint256,
        uint256,
        uint256,
        address,
        uint256,
        uint256,
        uint8,
        uint8,
        bytes32,
        bytes32
    ) external returns (uint256[3] memory);

    function removeLiquidity(
        address,
        address,
        uint256,
        uint256[2] memory,
        uint256[2] memory,
        address,
        uint256,
        uint256,
        uint8
    ) external returns (uint256[3] memory);

    function removeLiquidityByPair(
        IPancakeswapPair,
        uint256,
        uint256[2] memory,
        uint256[2] memory,
        address,
        uint256,
        uint256,
        uint8
    ) external returns (uint256[3] memory);

    function removeLiquidityWithPermit(
        address,
        address,
        uint256,
        uint256[2] memory,
        uint256[2] memory,
        address,
        uint256,
        uint256,
        uint8,
        uint8,
        bytes32,
        bytes32
    ) external returns (uint256[3] memory);
}
