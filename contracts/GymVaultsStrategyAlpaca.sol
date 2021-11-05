pragma solidity 0.8.7;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IPancakeRouter01.sol";
import "./interfaces/IPancakeRouter02.sol";
import "./interfaces/IAlpacaToken.sol";
import "./interfaces/IVaultConfig.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IWETH.sol";
import "hardhat/console.sol";

interface IFarm {
    function userInfo(uint256 _pid, address _user)
        external
        view
        returns (
            uint256 amount,
            uint256 rewardDebt,
            uint256 bonusDebt,
            uint256 fundedBy
        );
}

interface ITreasury {
    function notifyExternalReward(uint256 _amount) external;
}

interface IFairLaunch {
    function pendingAlpaca(uint256 _pid, address _user) external view returns (uint256);

    function deposit(
        address _for,
        uint256 _pid,
        uint256 _amount
    ) external;

    function withdraw(
        address _for,
        uint256 _pid,
        uint256 _amount
    ) external;

    function withdrawAll(address _for, uint256 _pid) external;

    function harvest(uint256 _pid) external;
}

// SPDX-License-Identifier: MIT
contract GymVaultsStrategyAlpaca is Ownable, ReentrancyGuard, Pausable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /// This vault is purely for staking
    bool public isAutoComp;
    bool public strategyStopped;
    bool public checkForUnlockReward;

    /// address of vault.
    address public vaultContractAddress;
    /// address of farm
    address public farmContractAddress;
    /// pid of pool in farmContractAddress
    uint256 public pid;
    /// address of want token contract
    address public wantAddress;
    /// address of earn token contract
    address public earnedAddress;
    /// PancakeSwap: Router address
    address public uniRouterAddress;
    /// WBNB address
    address public constant wbnbAddress = address($(WBNB_TOKEN));
    /// BUSD address
    address public constant busdAddress = address($(BUSD));

    address public operator;
    address public strategist;
    /// allow public to call earn() function
    bool public notPublic;

    uint256 public lastEarnBlock;
    uint256 public wantLockedTotal;
    uint256 public sharesTotal;

    uint256 public controllerFee;
    /// 100 = 1%
    uint256 public constant controllerFeeMax = $(GymVaultsStrategyAlpaca_CONTROLLER_FEE_MAX);
    uint256 public constant controllerFeeUL = $(GymVaultsStrategyAlpaca_CONTROLLER_FEE_UL);
    /// 0% entrance fee (goes to pool + prevents front-running)
    uint256 public entranceFeeFactor;
    /// 100 = 1%
    uint256 public constant entranceFeeFactorMax = $(GymVaultsStrategyAlpaca_ENTRANCE_FEE_FACTOR_MAX);
    /// 0.5% is the max entrance fee settable. LL = lowerlimit
    uint256 public constant entranceFeeFactorLL = $(GymVaultsStrategyAlpaca_ENTRANCE_FEE_FACTOR_LL);

    address[] public earnedToWantPath;
    address[] public earnedToBusdPath;
    address[] public wantToEarnedPath;

    event Deposit(uint256 amount);
    event Withdraw(uint256 amount);
    event Farm(uint256 amount);
    event Compound(address token0Address, uint256 token0Amt, address token1Address, uint256 token1Amt);
    event Earned(address earnedAddress, uint256 earnedAmt);
    event BuyBack(address earnedAddress, address buyBackToken, uint256 earnedAmt, uint256 buyBackAmt, address receiver);
    event DistributeFee(address earnedAddress, uint256 fee, address receiver);
    event ConvertDustToEarned(address tokenAddress, address earnedAddress, uint256 tokenAmt);
    event InCaseTokensGetStuck(address tokenAddress, uint256 tokenAmt, address receiver);
    event ExecuteTransaction(address indexed target, uint256 value, string signature, bytes data);

    // _controller:  BvaultsBank
    // _buyBackToken1Info[]: buyBackToken1, buyBackAddress1, buyBackToken1MidRouteAddress
    // _buyBackToken2Info[]: buyBackToken2, buyBackAddress2, buyBackToken2MidRouteAddress
    // _token0Info[]: token0Address, token0MidRouteAddress
    // _token1Info[]: token1Address, token1MidRouteAddress
    constructor(
        address _controller,
        bool _isAutoComp,
        address _vaultContractAddress,
        address _farmContractAddress,
        uint256 _pid,
        address _wantAddress,
        address _earnedAddress,
        address _uniRouterAddress // address[] memory _token0Info, // address[] memory _token1Info
    ){
        operator = msg.sender;
        strategist = msg.sender;
        // to call earn if public not allowed
        uniRouterAddress = address($(ROUTER));
        notPublic = false;
        controllerFee = $(GymVaultsStrategyAlpaca_CONTROLLER_FEE);
        isAutoComp = _isAutoComp;
        wantAddress = _wantAddress;
        entranceFeeFactor = $(GymVaultsStrategyAlpaca_ENTRANCE_FEE_FACTOR);

        if (_uniRouterAddress != address(0)) uniRouterAddress = _uniRouterAddress;

        if (isAutoComp) {
            vaultContractAddress = _vaultContractAddress;
            farmContractAddress = _farmContractAddress;
            pid = _pid;
            earnedAddress = _earnedAddress;
            uniRouterAddress = _uniRouterAddress;

            earnedToBusdPath = [earnedAddress, busdAddress];
            earnedToWantPath = [earnedAddress, _wantAddress];
            wantToEarnedPath = [_wantAddress, earnedAddress];
        }

        transferOwnership(_controller);
    }

    receive() external payable {}

    fallback() external payable {}

    modifier onlyOperator() {
        require(operator == msg.sender, "GymVaultsStrategyAlpaca: caller is not the operator");
        _;
    }

    modifier onlyStrategist() {
        require(
            strategist == msg.sender || operator == msg.sender,
            "GymVaultsStrategyAlpaca: caller is not the strategist"
        );
        _;
    }

    modifier strategyRunning() {
        require(!strategyStopped, "GymVaultsStrategyAlpaca: strategy is not running");
        _;
    }

    function pause() external onlyOperator {
        _pause();
    }

    function unpause() external onlyOperator {
        _unpause();
    }

    function setOperator(address _operator) external onlyOperator {
        operator = _operator;
    }

    function setStrategist(address _strategist) external onlyOperator {
        strategist = _strategist;
    }

    /**
     * @notice  Function to set entrance fee
     * @param _entranceFeeFactor 100 = 1%
     */
    function setEntranceFeeFactor(uint256 _entranceFeeFactor) external onlyOperator {
        require(_entranceFeeFactor > entranceFeeFactorLL, "GymVaultsStrategyAlpaca: !safe - too low");
        require(_entranceFeeFactor <= entranceFeeFactorMax, "GymVaultsStrategyAlpaca: !safe - too high");
        entranceFeeFactor = _entranceFeeFactor;
    }

    /**
     * @notice  Function to set controller fee
     * @param _controllerFee 100 = 1%
     */
    function setControllerFee(uint256 _controllerFee) external onlyOperator {
        require(_controllerFee <= controllerFeeUL, "GymVaultsStrategyAlpaca: too high");
        controllerFee = _controllerFee;
    }

    function setNotPublic(bool _notPublic) external onlyOperator {
        notPublic = _notPublic;
    }

    function setCheckForUnlockReward(bool _checkForUnlockReward) external onlyOperator {
        checkForUnlockReward = _checkForUnlockReward;
    }

    function inCaseTokensGetStuck(
        address _token,
        uint256 _amount,
        address _to
    ) external onlyOperator {
        require(_token != earnedAddress, "!safe");
        require(_token != wantAddress, "!safe");
        IERC20(_token).safeTransfer(_to, _amount);
        emit InCaseTokensGetStuck(_token, _amount, _to);
    }

    function emergencyWithraw() external onlyOperator {
        (uint256 _wantAmt, , , ) = IFarm(farmContractAddress).userInfo(pid, address(this));
        IFairLaunch(farmContractAddress).withdraw(address(this), pid, _wantAmt);
        IVault(vaultContractAddress).withdraw(_wantAmt);
        strategyStopped = true;
    }

    function resumeStrategy() external onlyOperator {
        strategyStopped = false;
        farm();
    }

    /**
     * @notice  Function checks if user Autorised or not
     * @param _account Users address
     */
    function isAuthorised(address _account) public view returns (bool) {
        return (_account == operator) || (msg.sender == strategist);
    }

    /**
     * @notice  Adds deposit
     * @param _wantAmt Amount of want tokens that will be added to pool
     */
    function deposit(address, uint256 _wantAmt) public onlyOwner whenNotPaused strategyRunning returns (uint256) {
        IERC20(wantAddress).safeTransferFrom(address(msg.sender), address(this), _wantAmt);
        uint256 sharesAdded = _wantAmt;
        if (wantLockedTotal > 0) {
            sharesAdded = (_wantAmt * sharesTotal * entranceFeeFactor) / wantLockedTotal / entranceFeeFactorMax;
        }
        sharesTotal = sharesTotal + sharesAdded;

        if (isAutoComp) {
            _farm();
        } else {
            wantLockedTotal = wantLockedTotal + _wantAmt;
        }

        emit Deposit(_wantAmt);

        return sharesAdded;
    }

    function farm() public nonReentrant strategyRunning {
        _farm();
    }

    /**
     * @notice  Function to withdraw assets
     * @param _wantAmt Amount of want tokens that will be withdrawn
     */
    function withdraw(address, uint256 _wantAmt) public onlyOwner nonReentrant returns (uint256) {
        require(_wantAmt > 0, "GymVaultsStrategyAlpaca: !_wantAmt");
        IVault vault = IVault(vaultContractAddress);
        if (isAutoComp && !strategyStopped) {
            uint256 ibAmount = (_wantAmt * vault.totalSupply()) / vault.totalToken();
            IFairLaunch(farmContractAddress).withdraw(address(this), pid, ibAmount);
            vault.withdraw(ibAmount);
            if (
                vault.token() == IVaultConfig($(ALPACA_VAULT_CONFIG)).getWrappedNativeAddr()
                // address(this).balance > 0
            ) {
                IWETH($(WBNB_TOKEN)).deposit{value: _wantAmt}();
            }
        }

        uint256 wantAmt = IERC20(wantAddress).balanceOf(address(this));
        if (_wantAmt > wantAmt) {
            _wantAmt = wantAmt;
        }

        if (wantLockedTotal < _wantAmt) {
            _wantAmt = wantLockedTotal;
        }

        uint256 sharesRemoved = (_wantAmt * sharesTotal) / wantLockedTotal;
        if (sharesRemoved > sharesTotal) {
            sharesRemoved = sharesTotal;
        }
        sharesTotal = sharesTotal - sharesRemoved;
        wantLockedTotal = wantLockedTotal - _wantAmt;

        IERC20(wantAddress).safeTransfer(address(msg.sender), _wantAmt);
        emit Withdraw(_wantAmt);

        return sharesRemoved;
    }

    /**
     *  1. Harvest farm tokens
     *  2. Converts farm tokens into want tokens
     *  3. Deposits want tokens
     */
    function earn(uint256 _amountOutAmt, uint256 _deadline) public whenNotPaused {
        require(isAutoComp, "GymVaultsStrategyAlpaca: !isAutoComp");
        require(!notPublic || isAuthorised(msg.sender), "GymVaultsStrategyAlpaca: !authorised");

        // Harvest farm tokens
        IFairLaunch(farmContractAddress).harvest(pid);
        // Check if there is any unlocked amount
        if (checkForUnlockReward) {
            if (IAlpacaToken(earnedAddress).canUnlockAmount(address(this)) > 0) {
                IAlpacaToken(earnedAddress).unlock();
            }
        }

        // Converts farm tokens into want tokens
        uint256 earnedAmt = IERC20(earnedAddress).balanceOf(address(this));

        emit Earned(earnedAddress, earnedAmt);

        uint256 _distributeFee = distributeFees(earnedAmt);

        earnedAmt = earnedAmt - _distributeFee;

        IERC20(earnedAddress).safeIncreaseAllowance(uniRouterAddress, earnedAmt);

        if (earnedAddress != wantAddress) {
            // Swap half earned to token0
            IPancakeRouter02(uniRouterAddress).swapExactTokensForTokensSupportingFeeOnTransferTokens(
                earnedAmt,
                _amountOutAmt,
                earnedToWantPath,
                address(this),
                _deadline
            );
        }

        // Get want tokens, ie. add liquidity
        uint256 wantAmt = IERC20(wantAddress).balanceOf(address(this));
        if (wantAmt > 0) {
            emit Compound(wantAddress, wantAmt, address(0), 0);
        }

        lastEarnBlock = block.number;

        _farm();
    }

    /**
     * @notice  Converts dust tokens into earned tokens, which will be reinvested on the next earn().
     */
    function convertDustToEarned(uint256 _amountOutAmt, uint256 _deadline) public whenNotPaused {
        require(isAutoComp, "GymVaultsStrategyAlpaca: !isAutoComp");

        // Converts token0 dust (if any) to earned tokens
        uint256 wantAmt = IERC20(wantAddress).balanceOf(address(this));
        if (wantAddress != earnedAddress && wantAmt > 0) {
            IERC20(wantAddress).safeIncreaseAllowance(uniRouterAddress, wantAmt);

            // Swap all dust tokens to earned tokens
            IPancakeRouter02(uniRouterAddress).swapExactTokensForTokensSupportingFeeOnTransferTokens(
                wantAmt,
                _amountOutAmt,
                wantToEarnedPath,
                address(this),
                _deadline
            );
            emit ConvertDustToEarned(wantAddress, earnedAddress, wantAmt);
        }
    }

    function uniExchangeRate(uint256 _tokenAmount, address[] memory _path) public view returns (uint256) {
        uint256[] memory amounts = IPancakeRouter02(uniRouterAddress).getAmountsOut(_tokenAmount, _path);
        return amounts[amounts.length - 1];
    }

    function pendingHarvest() public view returns (uint256) {
        uint256 _earnedBal = IERC20(earnedAddress).balanceOf(address(this));
        return IFairLaunch(farmContractAddress).pendingAlpaca(pid, address(this)) + _earnedBal;
    }

    function pendingHarvestDollarValue() public view returns (uint256) {
        uint256 _pending = pendingHarvest();
        return (_pending == 0) ? 0 : uniExchangeRate(_pending, earnedToBusdPath);
    }

    function balanceInPool() public view returns (uint256) {
        (uint256 amount, , , ) = IFarm(farmContractAddress).userInfo(pid, address(this));
        return amount;
    }

    /**
     * @notice  Adds assets in vault
     */
    function _farm() internal {
        // add to vault to get ibToken
        uint256 wantAmt = IERC20(wantAddress).balanceOf(address(this));
        wantLockedTotal = wantLockedTotal + wantAmt;
        IERC20(wantAddress).safeIncreaseAllowance(vaultContractAddress, wantAmt);
        IVault(vaultContractAddress).deposit(wantAmt);
        // add ibToken to farm contract
        uint256 ibWantAmt = IERC20(vaultContractAddress).balanceOf(address(this));
        IERC20(vaultContractAddress).safeIncreaseAllowance(farmContractAddress, ibWantAmt);
        IFairLaunch(farmContractAddress).deposit(address(this), pid, ibWantAmt);
        emit Farm(wantAmt);
    }

    /**
     * @notice  Function to distribute Fees
     * @param _earnedAmt Amount of earned tokens that will be sent to operator ass fee
     */
    function distributeFees(uint256 _earnedAmt) internal returns (uint256 _fee) {
        if (_earnedAmt > 0) {
            // Performance fee
            if (controllerFee > 0) {
                _fee = (_earnedAmt * controllerFee) / controllerFeeMax;
                IERC20(earnedAddress).safeTransfer(operator, _fee);
                emit DistributeFee(earnedAddress, _fee, operator);
            }
        }
    }
}
