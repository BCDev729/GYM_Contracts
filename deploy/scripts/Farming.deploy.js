const { getDeploymentArgs } = require("../../utils");

module.exports = async function ({ run, getChainId }) {
	let deterministicDeploy;
	const chainId = await getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymFarming");

	const options = {
		contractName: "GymFarming",
		args: [
			deploymentArgs.bank,
			deploymentArgs.rewardToken,
			deploymentArgs.rewardPerBlock,
			deploymentArgs.startBlock
		]
	};

	await run("deploy:farming", {
		bankAddress: deploymentArgs.bank,
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
module.exports.dependencies = ["GymVaultsBank"];
