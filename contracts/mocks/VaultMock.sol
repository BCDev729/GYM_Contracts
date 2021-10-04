// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract VaultMock is ERC20("ibToken", "IT") {
    receive() external payable {}

    fallback() external payable {}

    address wantToken;
    address WBNB;

    constructor(
        // address _ibToken,
        address _wantToken
    ) {
        // ibToken = _ibToken;
        wantToken = _wantToken;
        // decimals(18);
    }

    /// @dev Add more token to the lending pool. Hope to get some good returns.
    function deposit(uint256 amountToken) external {
        IERC20(wantToken).transferFrom(msg.sender, address(this), amountToken);
        _mint(msg.sender, amountToken);
    }

    function withdraw(uint256 share) external {
        // IERC20(ibToken)._burn(msg.sender, share);
        IERC20(wantToken).transfer(msg.sender, share);
    }

    function token() external pure returns (address) {
        return address(0);
    }

    function totalToken() external pure returns (uint256) {
        return 10000;
    }
}
