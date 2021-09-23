// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWETH.sol";
import "hardhat/console.sol";

contract GymMLM is Ownable {
    uint256 public currentId;
    address public bankAddress;
    uint8[$$(gymMLM[1])] public directReferralBonuses;

    mapping(address => uint256) public addressToId;
    mapping(uint256 => address) public idToAddress;

    mapping(address => address) public userToReferrer;

    event NewReferral(address indexed user, address indexed referral);

    event ReferralRewardReceved(address indexed user, address indexed referral, uint256 amount);

    constructor() {
        directReferralBonuses = $$(gymMLM[0]);
        addressToId[$$(gymMLM[2])] = 1;
        idToAddress[1] = $$(gymMLM[2]);
        userToReferrer[$$(gymMLM[2])] = $$(gymMLM[2]);
        currentId = 2;
        transferOwnership($$(gymMLM[2])); // deployer address
    }

    modifier onlyBank() {
        require(msg.sender == bankAddress, "GymMLM:: Only bank");
        _;
    }

    receive() external payable {}

    fallback() external payable {}

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

        IERC20 token = IERC20(_wantAddr);
        if (_wantAddr != $$(contracts[2])) {
            while (index < length && addressToId[userToReferrer[_user]] != 1) {
                address referrer = userToReferrer[_user];
                uint256 reward = (_wantAmt * directReferralBonuses[index]) / 100;
                token.transfer(referrer, reward);
                emit ReferralRewardReceved(referrer, _user, reward);
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
            uint256 reward = (_wantAmt * directReferralBonuses[index]) / 100;
            IWETH($$(contracts[2])).withdraw(reward);
            payable(referrer).transfer(reward);
            emit ReferralRewardReceved(referrer, _user, reward);
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
