// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
pragma experimental ABIEncoderV2;

interface IFairLaunchV1 {
    // Data structure
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 bonusDebt;
        address fundedBy;
    }
    struct PoolInfo {
        address stakeToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accAlpacaPerShare;
        uint256 accAlpacaPerShareTilBonusEnd;
    }

    // Information query functions
    function userInfo(uint256 pid, address user) external view returns (IFairLaunchV1.UserInfo memory);

    // User's interaction functions
    function pendingAlpaca(uint256 _pid, address _user) external view returns (uint256);
}
