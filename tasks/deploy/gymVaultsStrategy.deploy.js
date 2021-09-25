module.exports = async function (
	{ contractName, bank, isAutoComp, vault, fairLaunch, pid, want, earn, router },
	{ deployments: { deterministic }, ethers: { getNamedSigners } }
) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic(contractName, {
		from: deployer.address,
		contract: "GymVaultsStrategyAlpaca",
		args: [ bank, isAutoComp, vault, fairLaunch, pid, want, earn, router],
		log: true,
		deterministicDeployment: true
	});
	await deterministicDeploy.deploy();
};
