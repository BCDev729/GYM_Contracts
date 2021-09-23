const { getDeploymentArgs } = require("../../utils");

module.exports = async function (hre) {
	const chainId = await getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymToken");
	const { deployer } = await getNamedAccounts();

	const options = {
		contractName: "GymToken",
		args: [deploymentArgs.holder],
	};

	await hre.run("deploy:gymToken", {
		holder: deploymentArgs.holder
	})

	try {
		await hre.run("verify:verify", {
			address: deterministic.address,
			constructorArguments: options.args,
		});
	} catch (e) {
		console.log(e.toString());
	}
};
module.exports.tags = ["GymToken"];
