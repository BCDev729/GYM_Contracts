const { getDeploymentArgs } = require("../../utils");

module.exports = async function ({ run, getChainId }) {
	let deterministicDeploy;
	const chainId = await getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymVaultsStrategyAlpacaBUSD");

	const options = {
		contractName: "GymVaultsStrategyAlpacaBUSD",
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
		contractName: "GymVaultsStrategyAlpacaBUSD",
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
module.exports.tags = ["GymVaultsStrategyAlpacaBUSD"];
module.exports.dependencies = ["GymVaultsBank"];
