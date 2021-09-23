const { getDeploymentArgs } = require("../../utils");

module.exports = async function (hre) {
	const chainId = await getChainId();
    console.log("🚀 ~ file: Farming.deploy.js ~ line 5 ~ chainId", chainId)
	const deploymentArgs = await getDeploymentArgs(chainId, "Farming");
    console.log("🚀 ~ file: Farming.deploy.js ~ line 6 ~ deploymentArgs", deploymentArgs)

	// const options = {
	// 	contractName: "GymFarming",
	// 	args: [
	// 		deploymentArgs.bank,
	// 		deploymentArgs.rewardToken,
	// 		deploymentArgs.rewardPerBlock,
	// 		deploymentArgs.startBlock,
	// 	],
	// };

	await hre.run("deploy:farming", {
		bankAddress: "0x3fa427d76b0d50933eD074b99AfA997C9785Eb33",
		rewardTokenAddress: "0x3fa427d76b0d50933eD074b99AfA997C9785Eb33",
		rewardPerBlock: deploymentArgs.rewardPerBlock,
		startBlock: deploymentArgs.startBlock,
	});

	// try {
	// 	await hre.run("verify:verify", {
	// 		address: deterministicDeploy.address,
	// 		constructorArguments: options.args,
	// 	});
	// } catch (e) {
	// 	console.log(e.toString());
	// }

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
// module.exports.dependencies = ["GymVaultsBank"];
