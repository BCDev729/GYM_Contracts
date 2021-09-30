module.exports = async function (
	{ startblock, gymtokenaddress, rewardrate },
	{ ethers: { getContractFactory }, upgrades: { deployProxy } }
) {
	// const { deployer } = await getNamedSigners();

	// const deterministicDeploy = await deterministic("GymVaultsBank", {
	// 	from: deployer.address,
	// 	contract: "GymVaultsBank",
	// 	args: [startblock, gymtokenaddress, rewardrate],
	// 	log: true,
	// 	deterministicDeployment: true
	// });
	// await deterministicDeploy.deploy();
	// return deterministicDeploy;

	const GymVaultsBank = await getContractFactory("GymVaultsBank");
	const gymVaultsBank = await deployProxy(GymVaultsBank, [startblock, gymtokenaddress, rewardrate]);
	await gymVaultsBank.deployed();
	console.log(gymVaultsBank.address);
	return gymVaultsBank.address;
};
