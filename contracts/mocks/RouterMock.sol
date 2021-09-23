// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract RouterMock {
    address lpToken;

    receive() external payable {}

    fallback() external payable {}

    constructor(address _lpToken) {
        lpToken = _lpToken;
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256,
        address[] calldata path,
        address to,
        uint256
    ) external {
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        IERC20(path[path.length - 1]).transfer(to, amountIn);
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256,
        address[] calldata path,
        address to,
        uint256
    ) external {
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        payable(to).transfer(amountIn);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256,
        uint256,
        address to,
        uint256
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountBDesired);
        IERC20(lpToken).transfer(to, $(ROUTER_MOCK_RETURN_AMOUNT));

        amountA = amountADesired;
        amountB = amountBDesired;
        liquidity = $(ROUTER_MOCK_RETURN_AMOUNT);
    }

    function addLiquidityETH(
        address token,
        uint256,
        uint256,
        uint256,
        address to,
        uint256
    )
        external
        payable
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        )
    {
        IERC20(token).transfer(to, $(ROUTER_MOCK_RETURN_AMOUNT));
        amountToken = 0;
        amountETH = 0;
        liquidity = $(ROUTER_MOCK_RETURN_AMOUNT);
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts)
    {}
}
