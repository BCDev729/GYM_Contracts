const { getDeploymentArgs } = require("../../utils");

module.exports = async function (hre) {
	// console.log( ethers);
	let deterministicDeploy;
	const chainId = await hre.getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymToken");

	const options = {
		contractName: "GymToken",
		args: [deploymentArgs.holder]
	};

	await hre.run("deploy:gymToken", {
		holder: deploymentArgs.holder
	});

	try {
		await hre.run("verify:verify", {
			address: deterministicDeploy.address,
			constructorArguments: options.args
		});
	} catch (e) {
		console.log(e.toString());
	}
};
module.exports.tags = ["GymToken"];
