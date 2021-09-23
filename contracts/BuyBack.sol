// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IERC20Burnable.sol";
import "./interfaces/IPancakeRouter02.sol";
import "hardhat/console.sol";

/**
 * @notice BuyBack contract:
 *   Swaps want token to reward token and burns them.
 */
contract BuyBack {
    using SafeERC20 for IERC20;

    address[] private _path;

    /**
     * @notice Function to buy and burn Gym reward token
     * @param _wantAdd: Want token address
     * @param _wantAmt: Amount of want token for swap
     * @param _rewardToken: Address of reward token
     */
    function buyAndBurnToken(
        address _wantAdd,
        uint256 _wantAmt,
        address _rewardToken,
        uint256 _minBurnAmt,
        uint256 _deadline
    ) public returns (uint256) {
        if (_wantAdd != _rewardToken) {
            uint256 burnAmt = IERC20(_rewardToken).balanceOf(address(this));
            IERC20(_wantAdd).safeIncreaseAllowance($$(contracts[0]), _wantAmt);
            _path = [_wantAdd, _rewardToken];

            IPancakeRouter02($$(contracts[0])).swapExactTokensForTokensSupportingFeeOnTransferTokens(
                _wantAmt,
                _minBurnAmt,
                _path,
                address(this),
                _deadline
            );

            burnAmt = IERC20(_rewardToken).balanceOf(address(this)) - burnAmt;
            IERC20Burnable(_rewardToken).burn(burnAmt);

            return burnAmt;
        }

        IERC20Burnable(_rewardToken).burn(_wantAmt);

        return _wantAmt;
    }
}
