// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

// FairLaunch is a smart contract for distributing ALPACA by asking user to stake the ERC20-based token.
contract FairLaunchMock {
    using SafeERC20 for IERC20;

    function deposit(
        address,
        uint256,
        uint256 _amount
    ) external {
        IERC20($(FAIR_LAUNCH_VAULT_ADDRESS)).safeTransferFrom(msg.sender, address(this), _amount);
    }

    // Withdraw Staking tokens from FairLaunchToken.
    function withdraw(
        address _for,
        uint256 _pid,
        uint256 _amount
    ) external {
        _withdraw(_for, _pid, _amount);
    }

    function _withdraw(
        address,
        uint256,
        uint256 _amount
    ) internal {
        IERC20($(FAIR_LAUNCH_VAULT_ADDRESS)).safeTransfer(address(msg.sender), _amount);
    }

    // Harvest ALPACAs earn from the pool.
    function harvest(uint256) external {
        IERC20($(FAIR_LAUNCH_MOCK_EARN_TOKEN_ADDRESS)).safeTransfer(address(msg.sender), $(FAIR_LAUNCH_RETURN_AMOUNT));
    }
}
