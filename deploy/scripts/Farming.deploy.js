const { getDeploymentArgs } = require("../../utils");

module.exports = async function ({ run, getChainId }) {
	const chainId = await getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymFarming");

	const options = {
		contractName: "GymFarming",
		args: [
			"0xFaBF92Ebd2528aC7C2E9663887b63c01aC7cD884",
			deploymentArgs.rewardToken,
			deploymentArgs.rewardPerBlock,
			deploymentArgs.startBlock
		]
	};

	const deterministicDeploy = await run("deploy:farming", {
		bankAddress: "0xFaBF92Ebd2528aC7C2E9663887b63c01aC7cD884",
		rewardTokenAddress: deploymentArgs.rewardToken,
		rewardPerBlock: deploymentArgs.rewardPerBlock.toString(),
		startBlock: deploymentArgs.startBlock.toString()
	});

	try {
		await run("verify:verify", {
			address: deterministicDeploy.address,
			constructorArguments: options.args
		});
	} catch (e) {
		console.log(e.toString());
	}
};

module.exports.tags = ["Farming"];
// module.exports.dependencies = ["GymVaultsBank"];
