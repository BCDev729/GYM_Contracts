// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IStrategy.sol";
import "hardhat/console.sol";

contract BankMock {
    receive() external payable {}

    fallback() external payable {}

    function deposit(address _strategy, uint256 _wantAmt) public {
        address _wantAddress = IStrategy(_strategy).wantAddress();
        IERC20(_wantAddress).approve(_strategy, _wantAmt);
        IStrategy(_strategy).deposit(msg.sender, _wantAmt);
    }

    function withdraw(address _strategy, uint256 _wantAmt) public {
        IStrategy(_strategy).withdraw(msg.sender, _wantAmt);
    }
}
