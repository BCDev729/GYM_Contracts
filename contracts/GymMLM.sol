// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWETH.sol";
import "hardhat/console.sol";

contract GymMLM is Ownable {
    uint256 public constant denominator = 1e12;
    uint256 public currentId;
    address public bankAddress;
    uint8[$(GymMLM_DIRECT_REFERRAL_BONUSES_LENGTH)] public directReferralBonuses;
    uint256[$(GymMLM_DIRECT_REFERRAL_BONUSES_LENGTH)] public levels;

    mapping(address => uint256) public addressToId;
    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public investment;
    mapping(address => address) public userToReferrer;
    mapping(address => uint256) public scoring;

    event NewReferral(address indexed user, address indexed referral);

    event ReferralRewardReceived(address indexed user, address indexed referral, uint256 level, uint256 amount, address wantAddress);

    constructor() {
        directReferralBonuses = $(GymMLM_DIRECT_REFERRAL_BONUSES);
        addressToId[$(GymMLM_OWNER)] = 1;
        idToAddress[1] = $(GymMLM_OWNER);
        userToReferrer[$(GymMLM_OWNER)] = $(GymMLM_OWNER);
        currentId = 2;
        levels = $(GymMLM_LEVELS);
        transferOwnership($(GymMLM_OWNER)); // deployer address
    }

    modifier onlyBank() {
        require(msg.sender == bankAddress, "GymMLM:: Only bank");
        _;
    }

    receive() external payable {}

    fallback() external payable {}

    function updateScoring(address _token, uint256 _score) external onlyOwner {
        scoring[_token] = _score;
    }

    function _addUser(address _user, address _referrer) private {
        addressToId[_user] = currentId;
        idToAddress[currentId] = _user;
        userToReferrer[_user] = _referrer;
        currentId++;
        emit NewReferral(_referrer, _user);
    }

    /**
     * @notice  Function to add GymMLM
     * @param _user Address of user
     * @param _referrerId Address of referrer
     */
    function addGymMLM(address _user, uint256 _referrerId) external onlyBank {
        address _referrer = userToReferrer[_user];

        if (_referrer == address(0)) {
            _referrer = idToAddress[_referrerId];
        }

        require(_user != address(0), "GymMLM::user is zero address");

        require(_referrer != address(0), "GymMLM::referrer is zero address");

        require(
            userToReferrer[_user] == address(0) || userToReferrer[_user] == _referrer,
            "GymMLM::referrer is zero address"
        );

        // If user didn't exsist before
        if (addressToId[_user] == 0) {
            _addUser(_user, _referrer);
        }
    }

    /**
     * @notice  Function to distribute rewards to referrers
     * @param _wantAmt Amount of assets that will be distributed
     * @param _wantAddr Address of want token contract
     * @param _user Address of user
     */
    function distributeRewards(
        uint256 _wantAmt,
        address _wantAddr,
        address _user
    ) public onlyBank {
        uint256 index;
        uint256 length = directReferralBonuses.length;

        investment[_user] += (_wantAmt * scoring[_wantAddr]) / denominator;
        IERC20 token = IERC20(_wantAddr);
        
        if (_wantAddr != $(WBNB_TOKEN)) {
            while (index < length && addressToId[userToReferrer[_user]] != 1) {
                address referrer = userToReferrer[_user];
                if (investment[referrer] >= levels[index]) {
                    uint256 reward = (_wantAmt * directReferralBonuses[index]) / 100;
                    token.transfer(referrer, reward);
                    emit ReferralRewardReceived(referrer, _user, index, reward, _wantAddr);
                }
                _user = userToReferrer[_user];
                index++;
            }

            if (index != length) {
                token.transfer(bankAddress, token.balanceOf(address(this)));
            }

            return;
        }

        while (index < length && addressToId[userToReferrer[_user]] != 1) {
            address referrer = userToReferrer[_user];
            if (investment[referrer] >= levels[index]) {
                uint256 reward = (_wantAmt * directReferralBonuses[index]) / 100;
                IWETH($(WBNB_TOKEN)).withdraw(reward);
                payable(referrer).transfer(reward);
                emit ReferralRewardReceived(referrer, _user, index, reward, _wantAddr);
            }
            _user = userToReferrer[_user];
            index++;
        }

        if (index != length) {
            token.transfer(bankAddress, token.balanceOf(address(this)));
        }
    }

    function setBankAddress(address _bank) external onlyOwner {
        bankAddress = _bank;
    }
}
