const { getDeploymentArgs } = require("../../utils");

module.exports = async function (hre) {
	const chainId = await hre.ethers.getChainId();
	const deploymentArgs = await getDeploymentArgs(chainId, "GymVaultsStrategyAlpaca");
	const { deployer } = await hre.ethers.getNamedAccounts();

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
			deploymentArgs.router,
		],
		owner: deploymentArgs.bank,
	};

	const deterministic = await hre.deployments.deterministic("GymVaultsStrategyAlpaca", {
		from: deployer,
		contract: "GymVaultsStrategyAlpaca",
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
	//     try {
	//         await hre.run("verify:verify", {
	//             address: contract.address,
	//             constructorArguments: options.args
	//         });
	//     } catch (e) {
	//         console.log(e.toString())
	//     }
	// })
};
module.exports.tags = ["GymVaultsStrategyAlpaca"];
// module.exports.dependencies = ["GymVaultsBank"]
