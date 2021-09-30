const { getDeploymentArgs } = require("../../utils");

module.exports = async function ({ run, getChainId }) {
	const chainId = await getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymToken");

	const options = {
		contractName: "GymToken",
		args: [deploymentArgs.holder]
	};

	const deterministicDeploy = await run("deploy:gymToken", {
		holder: deploymentArgs.holder
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
module.exports.tags = ["GymToken"];
