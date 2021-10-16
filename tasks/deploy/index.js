const { task } = require("hardhat/config");
require("./mocks");

task("deploy:greeter", "Deploy Greeter contract", require("./greeter.deploy")).addParam(
	"msg",
	"Hello msg",
	"Hello to quickStart Project"
);

task("deploy:buyBack", "Deploy BuyBack contract", require("./buyBack.deploy"));

task("deploy:gymToken", "Deploy GymToken contract", require("./gymToken.deploy")).addParam("holder", "Holder address");

task("deploy:farming", "Deploy GymFarming contract", require("./farming.deploy"))
	.addParam("bankAddress", "GymVaultsBank address")
	.addParam("rewardTokenAddress", "RewardToken address")
	.addParam("rewardPerBlock", "rewardPerBlock")
	.addParam("startBlock", "startBlock");

task("deploy:gymVaultsBank", "Deploy GymVaultsBank contract", require("./gymVaultsBank.deploy"))
	.addParam("startblock", "startBlock")
	.addParam("gymTokenAddress", "gymTokenAddress address")
	.addParam("rewardRate", "rewardRate");

task("deploy:gymVaultsBankProxy", "Deploy GymVaultsBankProxy contract", require("./gymVaultsBankProxy.deploy"))
	.addParam("startblock", "startBlock")
	.addParam("gymTokenAddress", "gymTokenAddress address")
	.addParam("rewardRate", "rewardRate");

task("deploy:gymMLM", "Deploy GymMLM contract", require("./gymMLM.deploy"));

task("deploy:gymVaultsStrategy", "Deploy GymVaultsStrategy contract", require("./gymVaultsStrategy.deploy"))
	.addParam("contractName", "contractName")
	.addParam("bank", "GymVaultsBank address")
	.addParam("isAutoComp", "Boolean")
	.addParam("vault", "vault address")
	.addParam("fairLaunch", "fairLaunch address")
	.addParam("pid", "pool id on fairlunch")
	.addParam("want", "want token address")
	.addParam("earn", "earn token address")
	.addParam("router", "router address");

task("deploy:gymVaultsStrategyProxy", "Deploy GymVaultsStrategyProxy contract", require("./gymVaultsStrategyProxy.deploy"))
	.addParam("contractName", "contractName")
	.addParam("bank", "GymVaultsBank address")
	.addParam("isAutoComp", "Boolean")
	.addParam("vault", "vault address")
	.addParam("fairLaunch", "fairLaunch address")
	.addParam("pid", "pool id on fairlunch")
	.addParam("want", "want token address")
	.addParam("earn", "earn token address")
	.addParam("router", "router address");
