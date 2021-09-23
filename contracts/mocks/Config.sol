// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Config {
    address WBNB;

    constructor(
        // address _ibToken,
        address _WBNB
    ) {
        // ibToken = _ibToken;
        WBNB = _WBNB;
        // decimals(18);
    }

    /// @dev Add more token to the lending pool. Hope to get some good returns.
    function getWrappedNativeAddr() external view returns (address) {
        return WBNB;
    }
}
