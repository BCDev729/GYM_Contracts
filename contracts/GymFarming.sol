// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ILiquidityProvider.sol";
import "./interfaces/IPancakeRouter02.sol";
import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GymFarming is Ownable, ReentrancyGuard { 
    using SafeERC20 for IERC20;
    /**
     * @notice Info of each user
     * @param amount: How many LP tokens the user has provided
     * @param rewardDebt: Reward debt. See explanation below
     */
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
    }
    /**
     * @notice Info of each pool
     * @param lpToken: Address of LP token contract
     * @param allocPoint: How many allocation points assigned to this pool. rewards to distribute per block
     * @param lastRewardBlock: Last block number that rewards distribution occurs
     * @param accRewardPerShare: Accumulated rewards per share, times 1e18. See below
     */
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. rewards to distribute per block.
        uint256 lastRewardBlock; // Last block number that rewards distribution occurs.
        uint256 accRewardPerShare; // Accumulated rewards per share, times 1e18. See below.
    }
    /// The reward token
    IERC20 public rewardToken;
    uint256 public rewardPerBlock;
    /// Info of each pool.
    PoolInfo[] public poolInfo;
    /// Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(address => bool) public isPoolExist;
    /// Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint;
    /// The block number when reward mining starts.
    uint256 public startBlock;
    /// The Liquidity Provider
    ILiquidityProvider public liquidityProvider = ILiquidityProvider($(LIQUIDITY_PROVIDER));
    uint256 public liquidityProviderApiId = $(GymFarming_LIQUIDITY_PROVIDER_API_ID);
    address public bankAddress;
    address public constant ROUTER_ADDRESS = $(ROUTER);
    address public constant wbnbAddress = address($(WBNB_TOKEN));
    address[] public rewardTokenToWBNB;
    uint256 private rewardPerBlockChangesCount;
    uint256 private lastChangeBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Provider(address oldProvider, uint256 oldApi, address newProvider, uint256 newApi);

    // #if IS_PROXY
    function initialize(
        address _bankAddress,
        address _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock
    ) public {
        __Ownable_init();
        __ReentrancyGuard_init();
        require(address(_rewardToken) != address(0x0), "GymFarming::SET_ZERO_ADDRESS");
        bankAddress = _bankAddress;
        rewardToken = IERC20(_rewardToken);
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        rewardPerBlockChangesCount = $(GymFarming_REWARD_CHANGE_COUNT);
        lastChangeBlock = _startBlock;

        rewardTokenToWBNB = [_rewardToken, wbnbAddress];
        transferOwnership($(GymFarming_OWNER));
    }

    // #else
    constructor(
        address _bankAddress,
        address _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock
    ) {
        require(address(_rewardToken) != address(0x0), "GymFarming::SET_ZERO_ADDRESS");
        bankAddress = _bankAddress;
        rewardToken = IERC20(_rewardToken);
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        rewardPerBlockChangesCount = $(GymFarming_REWARD_CHANGE_COUNT);
        lastChangeBlock = _startBlock;
        rewardTokenToWBNB = [_rewardToken, wbnbAddress];

        transferOwnership($(GymFarming_OWNER));
    }

    // #endif

    modifier poolExists(uint256 _pid) {
        require(_pid < poolInfo.length, "GymFarming::UNKNOWN_POOL");
        _;
    }

    modifier onlyBank() {
        require(msg.sender == bankAddress, "GymFarming:: Only bank");
        _;
    }

    receive() external payable {}

    fallback() external payable {}

    /// @return All pools amount
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @notice View function to see total pending rewards on frontend
     * @param _user: user address for which reward must be calculated
     * @return total Return reward for user
     */
    function pendingRewardTotal(address _user) external view returns (uint256 total) {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            total += pendingReward(pid, _user);
        }
    }

    /**
     * @notice Function to set reward token
     * @param _rewardToken: address of reward token
     */
    function setRewardToken(IERC20 _rewardToken) external onlyOwner {
        rewardToken = _rewardToken;
    }

    /**
     * @notice Function to set amount of reward per block
     */
    function setRewardPerBlock() external onlyOwner {
        massUpdatePools();
        if (block.number - lastChangeBlock > $(GymFarming_REWARD_CHANGE_BLOCKS) && rewardPerBlockChangesCount > 0) {
            rewardPerBlock = (rewardPerBlock * $(GymFarming_COEFFICIENT)) / 1e12;
            rewardPerBlockChangesCount -= 1;
            lastChangeBlock = block.number;
        }
    }

    /**
     * @param _from: block block from which the reward is calculated
     * @param _to: block block before which the reward is calculated
     * @return Return reward multiplier over the given _from to _to block
     */
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        return (rewardPerBlock * (_to - _from));
    }

    /**
     * @notice View function to see pending rewards on frontend
     * @param _pid: pool ID for which reward must be calculated
     * @param _user: user address for which reward must be calculated
     * @return Return reward for user
     */
    function pendingReward(uint256 _pid, address _user) public view poolExists(_pid) returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 reward = (multiplier * pool.allocPoint) / totalAllocPoint;
            accRewardPerShare = accRewardPerShare + ((reward * 1e18) / lpSupply);
        }
        return (user.amount * accRewardPerShare) / 1e18 - user.rewardDebt;
    }

    /**
     * @notice Add a new lp to the pool. Can only be called by the owner
     * @param _allocPoint: allocPoint for new pool
     * @param _lpToken: address of lpToken for new pool
     * @param _withUpdate: if true, update all pools
     */
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        bool _withUpdate
    ) public onlyOwner {
        require(!isPoolExist[address(_lpToken)], "GymFarming::DUPLICATE_POOL");
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint += _allocPoint;
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accRewardPerShare: 0
            })
        );
        isPoolExist[address(_lpToken)] = true;
    }

    /**
     * @notice Update the given pool's reward allocation point. Can only be called by the owner
     */
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner poolExists(_pid) {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    /**
     * @notice Function which take ETH and tokens, add liquidity with provider and deposit given LP's
     * @param _pid: pool ID where we want deposit
     * @param _tokenAmount: amount of tokens for staking
     * @param _amountAMin: bounds the extent to which the B/A price can go up before the transaction reverts.
        Must be <= amountADesired.
     * @param _amountBMin: bounds the extent to which the A/B price can go up before the transaction reverts.
        Must be <= amountBDesired
     * @param _minAmountOutA: the minimum amount of output A tokens that must be received
        for the transaction not to revert
     */
    function speedStake(
        uint256 _pid,
        uint256 _tokenAmount,
        uint256 _amountAMin,
        uint256 _amountBMin,
        uint256 _minAmountOutA,
        uint256 _deadline
    ) public payable poolExists(_pid) {
        IPancakeRouter02 router = IPancakeRouter02(ROUTER_ADDRESS);

        updatePool(_pid);
        IPancakeswapPair lpToken = IPancakeswapPair(address(poolInfo[_pid].lpToken));

        require((lpToken.token0() == router.WETH()) || (lpToken.token1() == router.WETH()), "Wrong poolID");

        uint256 bnbAmount = msg.value;

        if (_tokenAmount > 0) {
            IERC20 token = IERC20(lpToken.token0());

            if (lpToken.token0() == router.WETH()) {
                token = IERC20(lpToken.token1());
            }

            address[] memory path = new address[](2);

            path[0] = address(token);
            path[1] = wbnbAddress;

            token.safeTransferFrom(msg.sender, address(this), _tokenAmount);
            token.approve(ROUTER_ADDRESS, _tokenAmount);

            uint256[] memory swapResult = router.swapExactTokensForETH(_tokenAmount, 0, path, address(this), _deadline);

            bnbAmount += swapResult[1];
        }

        uint256 lp = liquidityProvider.addLiquidityETHByPair{value: bnbAmount}(
            lpToken,
            address(this),
            _amountAMin,
            _amountBMin,
            _minAmountOutA,
            _deadline,
            liquidityProviderApiId
        );

        _deposit(_pid, lp, msg.sender);
    }

    /**
     * @notice Update reward vairables for all pools
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /**
     * @notice Update reward variables of the given pool to be up-to-date
     * @param _pid: pool ID for which the reward variables should be updated
     */
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 reward = (multiplier * pool.allocPoint) / totalAllocPoint;
        pool.accRewardPerShare = pool.accRewardPerShare + ((reward * 1e18) / lpSupply);
        pool.lastRewardBlock = block.number;
    }

    /**
     * @notice Deposit LP tokens to GymFarming for reward allocation
     * @param _pid: pool ID on which LP tokens should be deposited
     * @param _amount: the amount of LP tokens that should be deposited
     */
    function deposit(uint256 _pid, uint256 _amount) public poolExists(_pid) {
        updatePool(_pid);
        poolInfo[_pid].lpToken.safeTransferFrom(msg.sender, address(this), _amount);
        _deposit(_pid, _amount, msg.sender);
    }

    function claimAndDeposit(
        uint256 _pid,
        uint256 _amountAMin,
        uint256 _amountBMin,
        uint256 _minAmountOutA,
        uint256 _deadline
    ) external payable poolExists(_pid) {
        UserInfo storage user = userInfo[_pid][msg.sender];
        IPancakeRouter02 router = IPancakeRouter02(ROUTER_ADDRESS);

        uint256 bnbAmount = msg.value;

        if (user.amount > 0) {
            updatePool(_pid);

            uint256 accRewardPerShare = poolInfo[_pid].accRewardPerShare;

            uint256 pending = (user.amount * accRewardPerShare) / 1e18 - user.rewardDebt;

            user.rewardDebt = (user.amount * accRewardPerShare) / 1e18;

            rewardToken.approve(ROUTER_ADDRESS, pending);

            uint256[] memory swapResult = router.swapExactTokensForETH(
                pending,
                0,
                rewardTokenToWBNB,
                address(this),
                _deadline
            );

            bnbAmount += swapResult[1];
        }

        uint256 lp = liquidityProvider.addLiquidityETHByPair{value: bnbAmount}(
            IPancakeswapPair(address(poolInfo[_pid].lpToken)),
            address(this),
            _amountAMin,
            _amountBMin,
            _minAmountOutA,
            _deadline,
            liquidityProviderApiId
        );

        _deposit(_pid, lp, msg.sender);
    }

    /**
     * @notice Deposit LP tokens to GymFarming from GymVaultsBank
     * @param _pid: pool ID on which LP tokens should be deposited
     * @param _amount: the amount of reward tokens that should be converted to LP tokens and deposits to GymFarming contract
     * @param _from: Address of user that called function from GymVaultsBank
     */
    function autoDeposit(
        uint256 _pid,
        uint256 _amount,
        uint256 _amountTokenMin,
        uint256 _amountETHMin,
        uint256 _minAmountOut,
        address _from,
        uint256 _deadline
    ) public payable poolExists(_pid) onlyBank {
        updatePool(_pid);
        rewardToken.transferFrom(msg.sender, address(this), _amount);
        uint256 contractbalance = address(this).balance - msg.value;
        rewardToken.approve(ROUTER_ADDRESS, _amount);
        IPancakeRouter02(ROUTER_ADDRESS).swapExactTokensForETHSupportingFeeOnTransferTokens(
            _amount,
            _amountETHMin,
            rewardTokenToWBNB,
            address(this),
            _deadline
        );
        uint256 balanceDifference = address(this).balance - contractbalance;

        uint256 lp = liquidityProvider.addLiquidityETH{value: balanceDifference}(
            address(rewardToken),
            address(this),
            _amountTokenMin,
            _amountETHMin,
            _minAmountOut,
            _deadline,
            liquidityProviderApiId
        );

        _deposit(_pid, lp, _from);
    }

    /**
     * @notice Function which send accumulated reward tokens to messege sender
     * @param _pid: pool ID from which the accumulated reward tokens should be received
     */
    function harvest(uint256 _pid) public poolExists(_pid) {
        _harvest(_pid, msg.sender);
    }

    /**
     * @notice Function which send accumulated reward tokens to messege sender from all pools
     */
    function harvestAll() public {
        uint256 length = poolInfo.length;
        for (uint256 i = 0; i < length; i++) {
            if (poolInfo[i].allocPoint > 0) {
                harvest(i);
            }
        }
    }

    /**
     * @notice Function which withdraw LP tokens to messege sender with the given amount
     * @param _pid: pool ID from which the LP tokens should be withdrawn
     * @param _amount: the amount of LP tokens that should be withdrawn
     */
    function withdraw(uint256 _pid, uint256 _amount) public poolExists(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = (user.amount * pool.accRewardPerShare) / 1e18 - user.rewardDebt;
        safeRewardTransfer(msg.sender, pending);
        emit Harvest(msg.sender, _pid, pending);
        user.amount -= _amount;
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e18;
        pool.lpToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @notice Function which transfer reward tokens to _to with the given amount
     * @param _to: transfer reciver address
     * @param _amount: amount of reward token which should be transfer
     */
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        if (_amount > 0) {
            uint256 rewardTokenBal = rewardToken.balanceOf(address(this));
            if (_amount > rewardTokenBal) {
                rewardToken.transfer(_to, rewardTokenBal);
            } else {
                rewardToken.transfer(_to, _amount);
            }
        }
    }

    /**
     * @notice Function for updating user info
     */
    function _deposit(
        uint256 _pid,
        uint256 _amount,
        address _from
    ) private {
        UserInfo storage user = userInfo[_pid][_from];
        _harvest(_pid, _from);
        user.amount += _amount;
        user.rewardDebt = (user.amount * poolInfo[_pid].accRewardPerShare) / 1e18;
        emit Deposit(_from, _pid, _amount);
    }

    /**
     * @notice Private function which send accumulated reward tokens to givn address
     * @param _pid: pool ID from which the accumulated reward tokens should be received
     * @param _from: Recievers address
     */
    function _harvest(uint256 _pid, address _from) private poolExists(_pid) {
        UserInfo storage user = userInfo[_pid][_from];
        if (user.amount > 0) {
            updatePool(_pid);
            uint256 accRewardPerShare = poolInfo[_pid].accRewardPerShare;
            uint256 pending = (user.amount * accRewardPerShare) / 1e18 - user.rewardDebt;
            safeRewardTransfer(_from, pending);
            user.rewardDebt = (user.amount * accRewardPerShare) / 1e18;
            emit Harvest(_from, _pid, pending);
        }
    }
}
