const { getDeploymentArgs } = require("../../utils");

module.exports = async function ({ run, getChainId }) {
	let deterministicDeploy;
	const chainId = await getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymVaultsStrategyAlpaca");

	const options = {
		contractName: "GymVaultsStrategyAlpaca",
		args: [
			deploymentArgs.bank,
			deploymentArgs.isAutoComp,
			deploymentArgs.vault,
			deploymentArgs.fairLaunch,
			deploymentArgs.pid,
			deploymentArgs.want,
			deploymentArgs.earn,
			deploymentArgs.router
		],
		owner: deploymentArgs.bank
	};

	await run("deploy:gymVaultsStrategy", {
		contractName: "GymVaultsStrategyAlpaca",
		bank: deploymentArgs.bank,
		isAutoComp: deploymentArgs.isAutoComp.toString(),
		vault: deploymentArgs.vault,
		fairLaunch: deploymentArgs.fairLaunch,
		pid: deploymentArgs.pid.toString(),
		want: deploymentArgs.want,
		earn: deploymentArgs.earn,
		router: deploymentArgs.router
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
module.exports.tags = ["GymVaultsStrategyAlpaca"];
module.exports.dependencies = ["GymVaultsBank"];
