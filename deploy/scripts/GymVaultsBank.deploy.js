const { getDeploymentArgs } = require("../../utils");

module.exports = async function (hre) {
	let deterministicDeploy;
	const chainId = await getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymVaultsBank");

	const options = {
		contractName: "GymVaultsBank",
		args: [deploymentArgs.startBlock, deploymentArgs.gymTokenAddress, deploymentArgs.rewardRate]
	};
	await hre.run("deploy:gymVaultsBank", {
		startblock: deploymentArgs.startBlock.toString(),
		gymtokenaddress: deploymentArgs.gymTokenAddress, 
		rewardrate: deploymentArgs.rewardRate.toString()
	});
console.log("here");
	try {
		await hre.run("verify:verify", {
			address: deterministicDeploy.address,
			constructorArguments: options.args
		});
	} catch (e) {
		console.log(e.toString());
	}
};
module.exports.tags = ["GymVaultsBank"];
module.exports.dependencies = ["GymToken", "BuyBack"];
