module.exports = async function (
	{ contractName, bank, isAutoComp, vault, fairLaunch, pid, want, earn, router },
	{
		ethers: {
			getNamedSigners,
		},
		deployments: { deterministic },
		upgrades: { deployProxy }
	}
) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic(contractName, {
		from: deployer.address,
		contract: "GymVaultsStrategyAlpaca",
		args: [bank, isAutoComp, vault, fairLaunch, pid, want, earn, router],
		log: true,
		deterministicDeployment: true
	});
	await deterministicDeploy.deploy();
	return deterministicDeploy;

	// const GymVaultsStrategy = await getContractFactory(contractName);
	// const gymVaultsStrategy = await deployProxy(GymVaultsStrategy, [
	// 	bank,
	// 	isAutoComp,
	// 	vault,
	// 	fairLaunch,
	// 	pid,
	// 	want,
	// 	earn,
	// 	router
	// ]);
	// await gymVaultsStrategy.deployed();
	// console.log(gymVaultsStrategy.address);
	// return gymVaultsStrategy.address;
};
