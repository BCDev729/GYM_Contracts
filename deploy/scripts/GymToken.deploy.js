const { getDeploymentArgs } = require("../../utils");

module.exports = async function (hre) {
	const chainId = await hre.ethers.getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymToken");
	const { deployer } = await hre.ethers.getNamedAccounts();

	const options = {
		contractName: "GymToken",
		args: [deploymentArgs.holder],
	};

	const deterministic = await hre.deployments.deterministic("GymToken", {
		from: deployer,
		contract: "GymToken",
		args: [deploymentArgs.holder],
		log: true,
		skipIfAlreadyDeployed: false,
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
module.exports.tags = ["GymToken"];
