// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FarmMock {
    struct PoolInfo {
        address lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. CAKEs to distribute per block.
        uint256 lastRewardBlock; // Last block number that CAKEs distribution occurs.
        uint256 accCakePerShare; // Accumulated CAKEs per share, times 1e12. See below.
    }

    PoolInfo[] public poolInfo;

    address earnToken;

    constructor(address want, address _earnToken) {
        poolInfo.push(PoolInfo({lpToken: want, allocPoint: 10, lastRewardBlock: block.number, accCakePerShare: 0}));

        earnToken = _earnToken;
    }

    // Deposit LP tokens to MasterChef for CAKE allocation.
    function deposit(uint256 _pid, uint256 _amount) external {
        PoolInfo storage pool = poolInfo[_pid];
        IERC20(pool.lpToken).transferFrom(msg.sender, address(this), _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) external {
        PoolInfo storage pool = poolInfo[_pid];
        if (_amount > IERC20(pool.lpToken).balanceOf(address(this))) {
            _amount = IERC20(pool.lpToken).balanceOf(address(this));
        }
        IERC20(pool.lpToken).transfer(msg.sender, _amount);
        IERC20(earnToken).transfer(msg.sender, $(FARM_MOCK_RETURN_AMOUNT));
    }

    // Stake CAKE tokens to MasterChef
    function enterStaking(uint256 _amount) external {
        PoolInfo storage pool = poolInfo[0];
        IERC20(pool.lpToken).transferFrom(msg.sender, address(this), _amount);
    }

    // Withdraw CAKE tokens from STAKING.
    function leaveStaking(uint256 _amount) external {
        PoolInfo storage pool = poolInfo[0];
        if (_amount > IERC20(pool.lpToken).balanceOf(address(this))) {
            _amount = IERC20(pool.lpToken).balanceOf(address(this));
        }
        IERC20(pool.lpToken).transfer(msg.sender, _amount);
        IERC20(pool.lpToken).transfer(msg.sender, $(FARM_MOCK_RETURN_AMOUNT));
    }
}
