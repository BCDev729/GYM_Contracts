module.exports = async function (
	{ contractName, bank, isAutoComp, vault, fairLaunch, pid, want, earn, router },
	{ ethers: { getNamedSigners }, deployments: { deploy }, upgrades: { deployProxy } }
) {
	const { deployer } = await getNamedSigners();
	isAutoComp = isAutoComp === "true";

	const deterministicDeploy = await deploy(contractName, {
		from: deployer.address,
		contract: "GymVaultsStrategyAlpaca",
		args: [bank, isAutoComp, vault, fairLaunch, pid, want, earn, router],
		log: true,
		deterministicDeployment: false
	});
	// await deterministicDeploy.deploy();
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
