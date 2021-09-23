const { getDeploymentArgs } = require("../../utils");

module.exports = async function (hre) {
	const chainId = await hre.ethers.getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "Farming");
	const { deployer } = await hre.ethers.getNamedAccounts();

	const options = {
		contractName: "GymFarming",
		args: [
			deploymentArgs.bank,
			deploymentArgs.rewardToken,
			deploymentArgs.rewardPerBlock,
			deploymentArgs.startBlock,
		],
	};

	const deterministic = await hre.deployments.deterministic("GymFarming", {
		from: deployer,
		contract: "GymFarming",
		args: [...options.args],
		log: true,
		deterministicDeployment: true,
	});

	await deterministic.deploy();

	try {
		await hre.run("verify:verify", {
			address: deterministic.address,
			constructorArguments: options.args,
		});
	} catch (e) {
		console.log(e.toString());
	}

	// await contractDeploy(hre, options, async contract => {
	//   try {
	//     await hre.run("verify:verify", {
	//       address: contract.address,
	//       constructorArguments: options.args
	//     });
	//   } catch (e) {
	//     console.log(e.toString())
	//   }
	// })
};

module.exports.tags = ["Farming"];
module.exports.dependencies = ["GymVaultsBank"];
