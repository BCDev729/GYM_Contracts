const { getDeploymentArgs } = require("../../utils");

module.exports = async function (hre) {
	let deterministicDeploy;
	const chainId = await hre.getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymFarming");

	const options = {
		contractName: "GymFarming",
		args: [
			deploymentArgs.bank,
			deploymentArgs.rewardToken,
			deploymentArgs.rewardPerBlock,
			deploymentArgs.startBlock,
		],
	};

	await hre.run("deploy:farming", {
		bankAddress: deploymentArgs.bank,
		rewardTokenAddress: deploymentArgs.rewardToken,
		rewardPerBlock: deploymentArgs.rewardPerBlock.toString(),
		startBlock: deploymentArgs.startBlock.toString()
	});

	try {
		await hre.run("verify:verify", {
			address: deterministicDeploy.address,
			constructorArguments: options.args,
		});
	} catch (e) {
		console.log(e.toString());
	}
};

module.exports.tags = ["Farming"];
module.exports.dependencies = ["GymVaultsBank"];
