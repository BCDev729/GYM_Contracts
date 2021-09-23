const { task } = require("hardhat/config");

task(
	"deploy:greeter",
	"Deploy Greeter contract",
	require("./greeter.deploy")
).addParam("msg", "Hello msg", "Hello to quickStart Project");

task(
	"deploy:buyBack",
	"Deploy BuyBack contract",
	require("./buyBack.deploy")
);

task(
	"deploy:gymToken",
	"Deploy GymToken contract",
	require("./gymToken.deploy")
).addParam("holder", "Holder address");

task(
	"deploy:farming",
	"Deploy GymFarming contract",
	require("./farming.deploy")
)
.addParam("bankAddress", "GymVaultsBank address")
.addParam("rewardTokenAddress", "RewardToken address")
.addParam("rewardPerBlock", "rewardPerBlock")
.addParam("startBlock", "startBlock");

task(
	"deploy:gymVaultsBank",
	"Deploy GymVaultsBank contract",
	require("./gymVaultsBank.deploy")
)
.addParam("startblock", "startBlock")
.addParam("gymtokenaddress", "GymTokenAddress address")
.addParam("rewardrate", "rewardRate")