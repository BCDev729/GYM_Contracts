// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IStrategy.sol";
import "./interfaces/IERC20Burnable.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IBuyBack.sol";
import "./interfaces/IFairLaunch.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IFarming.sol";
import "./interfaces/IGymMLM.sol";
import "hardhat/console.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @notice GymVaultsBank contract:
 * - Users can:
 *   # Deposit token
 *   # Deposit BNB
 *   # Withdraw assets
 */

contract GymVaultsBank is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /**
     * @notice Info of each user
     * @param shares: How many LP tokens the user has provided
     * @param rewardDebt: Reward debt. See explanation below
     * @dev Any point in time, the amount of UTACOs entitled to a user but is pending to be distributed is:
     *   amount = user.shares / sharesTotal * wantLockedTotal
     *   pending reward = (amount * pool.accRewardPerShare) - user.rewardDebt
     *   Whenever a user deposits or withdraws want tokens to a pool. Here's what happens:
     *   1. The pool's `accRewardPerShare` (and `lastStakeTime`) gets updated.
     *   2. User receives the pending reward sent to his/her address.
     *   3. User's `amount` gets updated.
     *   4. User's `rewardDebt` gets updated.
     */
    struct UserInfo {
        uint256 shares;
        uint256 rewardDebt;
    }
    /**
     * @notice Info of each pool
     * @param want: Address of want token contract
     * @param allocPoint: How many allocation points assigned to this pool. GYM to distribute per block
     * @param lastRewardBlock: Last block number that reward distribution occurs
     * @param accUTacoPerShare: Accumulated rewardPool per share, times 1e18
     * @param strategy: Address of strategy contract
     */
    struct PoolInfo {
        IERC20 want;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accRewardPerShare;
        address strategy;
    }

    /**
     * @notice Info of each rewartPool
     * @param rewardToken: Address of reward token contract
     * @param rewardPerBlock: How many reward tokens will user get per block
     * @param totalPaidRewards: Total amount of reward tokens was paid
     */

    struct RewardPoolInfo {
        address rewardToken;
        uint256 rewardPerBlock;
    }

    /// Percent of amount that will be sent to relationship contract
    uint256 public constant RELATIONSHIP_REWARD = $$(gymVaultsBank[0]);
    /// Percent of amount that will be sent to vault contract
    uint256 public constant VAULTS_SAVING = $$(gymVaultsBank[1]);
    /// Percent of amount that will be sent to buyBack contract
    uint256 public constant BUY_AND_BURN_GYM = $$(gymVaultsBank[2]);

    /// Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint;
    /// Startblock number
    uint256 public startBlock;
    uint256 public withdrawFee;
    // contracts[8] - Buyback address
    address public constant buyBack = $$(contracts[8]);
    address public farming;
    // contracts[7] - RelationShip address
    address public constant relationship = $$(contracts[7]);
    /// Treasury address where will be sent all unused assets
    address public treasuryAddress;
    /// Info of each pool.
    PoolInfo[] public poolInfo;
    /// Info of each user that stakes want tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    /// Info of reward pool
    RewardPoolInfo public rewardPoolInfo;

    address[] private alpacaToWBNB;
    uint256 private lastChangeBlock;
    uint256 private rewardPerBlockChangesCount;

    /* ========== EVENTS ========== */

    event Initialized(address indexed executor, uint256 at);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event RewardPaid(address indexed token, address indexed user, uint256 amount);

    constructor(
        uint256 _startBlock,
        address _gym,
        uint256 _gymRewardRate
    ) {
        require(block.number < _startBlock, "GymVaultsBank: Start block must have a bigger value");
        startBlock = _startBlock;
        rewardPoolInfo = RewardPoolInfo({rewardToken: _gym, rewardPerBlock: _gymRewardRate});
        alpacaToWBNB = [$$(contracts[1]), $$(contracts[2])];
        lastChangeBlock = _startBlock;
        rewardPerBlockChangesCount = $$(gymVaultsBank[6]);
        transferOwnership($$(gymVaultsBank[8]));
        emit Initialized(msg.sender, block.number);
    }

    modifier onlyOnGymMLM() {
        require(IGymMLM(relationship).isOnGymMLM(msg.sender), "GymVaultsBank: Don't have relationship");
        _;
    }

    receive() external payable {}

    fallback() external payable {}

    /**
     * @notice Update the given pool's reward allocation point. Can only be called by the owner
     * @param _pid: Pool id that will be updated
     * @param _allocPoint: New allocPoint for pool
     */
    function set(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        massUpdatePools();
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    /**
     * @notice Update the given pool's strategy. Can only be called by the owner
     * @param _pid: Pool id that will be updated
     * @param _strategy: New strategy contract address for pool
     */
    function resetStrategy(uint256 _pid, address _strategy) external onlyOwner {
        PoolInfo storage pool = poolInfo[_pid];
        require(
            pool.want.balanceOf(poolInfo[_pid].strategy) == 0 || pool.accRewardPerShare == 0,
            "GymVaultsBank: Strategy not empty"
        );
        poolInfo[_pid].strategy = _strategy;
    }

    /**
     * @notice Migrates all assets to new strategy. Can only be called by the owner
     * @param _pid: Pool id that will be updated
     * @param _newStrategy: New strategy contract address for pool
     */
    function migrateStrategy(uint256 _pid, address _newStrategy) external onlyOwner {
        require(
            IStrategy(_newStrategy).wantLockedTotal() == 0 && IStrategy(_newStrategy).sharesTotal() == 0,
            "GymVaultsBank: New strategy not empty"
        );
        PoolInfo storage pool = poolInfo[_pid];
        address _oldStrategy = pool.strategy;
        uint256 _oldSharesTotal = IStrategy(_oldStrategy).sharesTotal();
        uint256 _oldWantAmt = IStrategy(_oldStrategy).wantLockedTotal();
        IStrategy(_oldStrategy).withdraw(address(this), _oldWantAmt);
        pool.want.transfer(_newStrategy, _oldWantAmt);
        IStrategy(_newStrategy).migrateFrom(_oldStrategy, _oldWantAmt, _oldSharesTotal);
        pool.strategy = _newStrategy;
    }

    /**
     * @notice Updates amount of reward tokens  per block that user will get. Can only be called by the owner
     */
    function updateRewardPerBlock() external nonReentrant onlyOwner {
        massUpdatePools();
        if (block.number - lastChangeBlock > $$(gymVaultsBank[5]) && rewardPerBlockChangesCount > 0) {
            rewardPoolInfo.rewardPerBlock = (rewardPoolInfo.rewardPerBlock * $$(gymVaultsBank[7])) / 1e12;
            rewardPerBlockChangesCount -= 1;
            lastChangeBlock = block.number;
        }
    }

    /**
     * @notice View function to see pending reward on frontend.
     * @param _pid: Pool id where user has assets
     * @param _user: Users address
     */
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 _accRewardPerShare = pool.accRewardPerShare;
        uint256 sharesTotal = IStrategy(pool.strategy).sharesTotal();
        if (block.number > pool.lastRewardBlock && sharesTotal != 0) {
            uint256 _multiplier = block.number - pool.lastRewardBlock;
            uint256 _reward = (_multiplier * rewardPoolInfo.rewardPerBlock * pool.allocPoint) / totalAllocPoint;
            _accRewardPerShare = _accRewardPerShare + ((_reward * 1e18) / sharesTotal);
        }
        return (user.shares * _accRewardPerShare) / 1e18 - user.rewardDebt;
    }

    /**
     * @notice View function to see staked Want tokens on frontend.
     * @param _pid: Pool id where user has assets
     * @param _user: Users address
     */
    function stakedWantTokens(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];

        uint256 sharesTotal = IStrategy(pool.strategy).sharesTotal();
        uint256 wantLockedTotal = IStrategy(poolInfo[_pid].strategy).wantLockedTotal();
        if (sharesTotal == 0) {
            return 0;
        }
        return (user.shares * wantLockedTotal) / sharesTotal;
    }

    /**
     * @notice Deposit in given pool
     * @param _pid: Pool id
     * @param _wantAmt: Amount of want token that user wants to deposit
     * @param _referrerId: Referrer address
     */
    function deposit(
        uint256 _pid,
        uint256 _wantAmt,
        uint256 _referrerId,
        uint256 _minBurnAmt,
        uint256 _deadline
    ) external payable {
        IGymMLM(relationship).addGymMLM(msg.sender, _referrerId);
        PoolInfo storage pool = poolInfo[_pid];
        if (address(pool.want) == $$(contracts[2])) {
            // If `want` is WBNB
            IWETH($$(contracts[2])).deposit{value: msg.value}();
            _wantAmt = msg.value;
        }
        _deposit(_pid, _wantAmt, _minBurnAmt, _deadline);
    }

    /**
     * @notice Withdraw user`s assets from pool
     * @param _pid: Pool id
     * @param _wantAmt: Amount of want token that user wants to withdraw
     */
    function withdraw(uint256 _pid, uint256 _wantAmt) external nonReentrant {
        _withdraw(_pid, _wantAmt);
    }

    /**
     * @notice Claim users rewards and add deposit in Farming contract
     * @param _pid: pool Id
     */
    function claimAndDeposit(
        uint256 _pid,
        uint256 _amountTokenMin,
        uint256 _amountETHMin,
        uint256 _minAmountOut,
        uint256 _deadline
    ) external payable {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        uint256 pending = (user.shares * pool.accRewardPerShare) / (1e18) - (user.rewardDebt);
        if (pending > 0) {
            IERC20(rewardPoolInfo.rewardToken).approve(farming, pending);
            IFarming(farming).autoDeposit{value: msg.value}(
                0,
                pending,
                _amountTokenMin,
                _amountETHMin,
                _minAmountOut,
                msg.sender,
                _deadline
            );
        }
        user.rewardDebt = (user.shares * (pool.accRewardPerShare)) / (1e18);
    }

    /**
     * @notice Claim users rewards from all pools
     */
    function claimAll() external {
        uint256 length = poolLength();
        for (uint256 i = 0; i <= length - 1; i++) {
            claim(i);
        }
    }

    /**
     * @notice  Function to set Treasury address
     * @param _treasuryAddress Address of treasury address
     */
    function setTreasuryAddress(address _treasuryAddress) external nonReentrant onlyOwner {
        treasuryAddress = _treasuryAddress;
    }

    /**
     * @notice  Function to set Farming address
     * @param _farmingAddress Address of treasury address
     */
    function setFarmingAddress(address _farmingAddress) external nonReentrant onlyOwner {
        farming = _farmingAddress;
    }

    /**
     * @notice  Function to set withdraw fee
     * @param _fee 100 = 1%
     */
    function setWithdrawFee(uint256 _fee) external nonReentrant onlyOwner {
        withdrawFee = _fee;
    }

    function poolLength() public view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @notice Claim users rewards from given pool
     * @param _pid pool Id
     */
    function claim(uint256 _pid) public {
        updatePool(_pid);
        _claim(_pid);
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        user.rewardDebt = (user.shares * (pool.accRewardPerShare)) / (1e18);
    }

    /**
     * @notice Function to Add pool
     * @param _want: Address of want token contract
     * @param _allocPoint: AllocPoint for new pool
     * @param _withUpdate: If true will call massUpdatePools function
     * @param _strategy: Address of Strategy contract
     */
    function add(
        IERC20 _want,
        uint256 _allocPoint,
        bool _withUpdate,
        address _strategy
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint + _allocPoint;
        poolInfo.push(
            PoolInfo({
                want: _want,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accRewardPerShare: 0,
                strategy: _strategy
            })
        );
    }

    /**
     * @notice Update reward variables for all pools. Be careful of gas spending!
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /**
     * @notice Update reward variables of the given pool to be up-to-date.
     * @param _pid: Pool id that will be updated
     */
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 sharesTotal = IStrategy(pool.strategy).sharesTotal();
        if (sharesTotal == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = block.number - pool.lastRewardBlock;
        if (multiplier <= 0) {
            return;
        }
        uint256 _rewardPerBlock = rewardPoolInfo.rewardPerBlock;
        uint256 _reward = (multiplier * _rewardPerBlock * pool.allocPoint) / totalAllocPoint;
        pool.accRewardPerShare = pool.accRewardPerShare + ((_reward * 1e18) / sharesTotal);
        pool.lastRewardBlock = block.number;
    }

    /**
     * @notice  Safe transfer function for reward tokens
     * @param _rewardToken Address of reward token contract
     * @param _to Address of reciever
     * @param _amount Amount of reward tokens to transfer
     */
    function safeRewardTransfer(
        address _rewardToken,
        address _to,
        uint256 _amount
    ) internal {
        uint256 _bal = IERC20(_rewardToken).balanceOf(address(this));
        if (_amount > _bal) {
            IERC20(_rewardToken).transfer(_to, _bal);
        } else {
            IERC20(_rewardToken).transfer(_to, _amount);
        }
    }

    /**
     * @notice Calculates amount of reward user will get.
     * @param _pid: Pool id
     */
    function _claim(uint256 _pid) internal {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 pending = (user.shares * pool.accRewardPerShare) / (1e18) - (user.rewardDebt);
        if (pending > 0) {
            address rewardToken = rewardPoolInfo.rewardToken;
            safeRewardTransfer(rewardToken, msg.sender, pending);
            emit RewardPaid(rewardToken, msg.sender, pending);
        }
    }

    /**
     * @notice Private deposit function
     * @param _pid: Pool id
     * @param _wantAmt: Amount of want token that user wants to deposit
     */
    function _deposit(
        uint256 _pid,
        uint256 _wantAmt,
        uint256 _minBurnAmt,
        uint256 _deadline
    ) private {
        updatePool(_pid);
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        if (user.shares > 0) {
            _claim(_pid);
        }

        if (_wantAmt > 0) {
            if (address(pool.want) != $$(contracts[2])) {
                // If `want` not WBNB
                pool.want.safeTransferFrom(address(msg.sender), address(this), _wantAmt);
            }

            pool.want.safeTransfer(relationship, (_wantAmt * RELATIONSHIP_REWARD) / 100);

            // Distribute MLM rewards
            IGymMLM(relationship).distributeRewards(_wantAmt, address(pool.want), msg.sender);

            pool.want.safeTransfer(buyBack, (_wantAmt * BUY_AND_BURN_GYM) / 100);

            IBuyBack(buyBack).buyAndBurnToken(
                address(pool.want),
                (_wantAmt * BUY_AND_BURN_GYM) / 100,
                rewardPoolInfo.rewardToken,
                _minBurnAmt,
                _deadline
            );

            _wantAmt = (_wantAmt * VAULTS_SAVING) / 100;
            pool.want.safeIncreaseAllowance(pool.strategy, _wantAmt);
            uint256 sharesAdded = IStrategy(poolInfo[_pid].strategy).deposit(msg.sender, _wantAmt);

            user.shares = user.shares + sharesAdded;
        }
        user.rewardDebt = (user.shares * (pool.accRewardPerShare)) / (1e18);

        // Send unsent rewards to the treasury address
        _transfer(address(pool.want), treasuryAddress, pool.want.balanceOf(address(this)));

        emit Deposit(msg.sender, _pid, _wantAmt);
    }

    /**
     * @notice Private withdraw function
     * @param _pid: Pool id
     * @param _wantAmt: Amount of want token that user wants to withdraw
     */
    function _withdraw(uint256 _pid, uint256 _wantAmt) private {
        updatePool(_pid);

        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        uint256 wantLockedTotal = IStrategy(poolInfo[_pid].strategy).wantLockedTotal();
        uint256 sharesTotal = IStrategy(poolInfo[_pid].strategy).sharesTotal();

        require(user.shares > 0, "GymVaultsBank: user.shares is 0");
        require(sharesTotal > 0, "GymVaultsBank: sharesTotal is 0");

        _claim(_pid);

        // Withdraw want tokens
        uint256 amount = (user.shares * (wantLockedTotal)) / (sharesTotal);
        if (_wantAmt > amount) {
            _wantAmt = amount;
        }
        if (_wantAmt > 0) {
            uint256 sharesRemoved = IStrategy(poolInfo[_pid].strategy).withdraw(msg.sender, _wantAmt);
            user.shares -= sharesRemoved;

            uint256 wantBal = IERC20(pool.want).balanceOf(address(this));
            if (wantBal < _wantAmt) {
                _wantAmt = wantBal;
            }

            if (_wantAmt > 0) {
                _transfer(address(pool.want), treasuryAddress, (_wantAmt * withdrawFee) / $$(gymVaultsBank[3]));
                _transfer(address(pool.want), msg.sender, pool.want.balanceOf(address(this)));
            }
        }
        user.rewardDebt = (user.shares * (pool.accRewardPerShare)) / (1e18);

        emit Withdraw(msg.sender, _pid, _wantAmt);
    }

    function _transfer(
        address _token,
        address _receiver,
        uint256 _amount
    ) private {
        if (_token == $$(contracts[2])) {
            // If _token is WBNB
            IWETH(_token).withdraw(_amount);
            payable(_receiver).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(_receiver, _amount);
        }
    }
}
