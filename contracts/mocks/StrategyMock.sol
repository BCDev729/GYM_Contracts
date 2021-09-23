// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

import "../interfaces/IStrategy.sol";

contract StrategyMock is IStrategy {
    using SafeERC20 for IERC20;

    address public want;
    uint256 private _wantLockedTotal;
    uint256 private _sharesTotal;

    constructor(address _want) {
        want = _want;
    }

    receive() external payable {}

    fallback() external payable {}

    // Total want tokens managed by strategy
    function wantLockedTotal() external view override returns (uint256) {
        return _wantLockedTotal;
    }

    // Sum of all shares of users to wantLockedTotal
    function sharesTotal() external view override returns (uint256) {
        return _sharesTotal;
    }

    function wantAddress() external view override returns (address) {
        return want;
    }

    function token0Address() external pure override returns (address) {
        revert("No implementation");
    }

    function token1Address() external pure override returns (address) {
        revert("No implementation");
    }

    function earnedAddress() external pure override returns (address) {
        revert("No implementation");
    }

    function ratio0() external pure override returns (uint256) {
        revert("No implementation");
    }

    function ratio1() external pure override returns (uint256) {
        revert("No implementation");
    }

    function getPricePerFullShare() public view override returns (uint256) {
        return (_sharesTotal == 0) ? 1e18 : (_wantLockedTotal * 1e18) / _sharesTotal;
    }

    function earn(uint256, uint256) external override {
        uint256 _earned = _wantLockedTotal / 100;
        IERC20(want).safeTransferFrom(msg.sender, address(this), _earned);
        _wantLockedTotal = _wantLockedTotal + _earned;
    }

    function deposit(address, uint256 _wantAmt) external override returns (uint256 _sharedAdded) {
        IERC20(want).safeTransferFrom(msg.sender, address(this), _wantAmt);
        _sharedAdded = (_wantAmt * 1e18) / getPricePerFullShare();
        _sharesTotal = _sharesTotal + _sharedAdded;
        _wantLockedTotal = _wantLockedTotal + _wantAmt;
    }

    function withdraw(address, uint256 _wantAmt) external override returns (uint256 _sharesRemoved) {
        IERC20(want).safeTransfer(msg.sender, _wantAmt);
        _sharesRemoved = (_wantAmt * 1e18) / getPricePerFullShare();
        _sharesTotal = _sharesTotal - _sharesRemoved;
        _wantLockedTotal = _wantLockedTotal - _wantAmt;
    }

    function migrateFrom(
        address _oldStrategy,
        uint256 _oldWantLockedTotal,
        uint256 _oldSharesTotal
    ) external override {
        require(_wantLockedTotal == 0 && _sharesTotal == 0, "strategy is not empty");
        require(want == IStrategy(_oldStrategy).wantAddress(), "!wantAddress");
        uint256 _wantAmt = IERC20(want).balanceOf(address(this));
        require(_wantAmt >= _oldWantLockedTotal, "short of wantLockedTotal");
        _sharesTotal = _oldSharesTotal;
        _wantLockedTotal = _wantLockedTotal + _wantAmt;
    }

    function inCaseTokensGetStuck(
        address,
        uint256,
        address
    ) external pure override {
        revert("No implementation");
    }
}
