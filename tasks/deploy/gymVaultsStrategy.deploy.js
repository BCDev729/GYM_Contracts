module.exports = async function (
	{ contractName, bank, isAutoComp, vault, fairLaunch, pid, want, earn, router },
	{ ethers: { getContractFactory }, upgrades: { deployProxy } }
) {
	const GymVaultsStrategy = await getContractFactory(contractName);
	const gymVaultsStrategy = await deployProxy(GymVaultsStrategy, [bank, isAutoComp, vault, fairLaunch, pid, want, earn, router]);
	await gymVaultsStrategy.deployed();
	console.log(gymVaultsStrategy.address);
	return gymVaultsStrategy.address;
};
