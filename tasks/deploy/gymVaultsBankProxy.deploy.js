module.exports = async function (
	{ startblock, gymTokenAddress, rewardRate },
	{ ethers: { getContractFactory }, upgrades: { deployProxy } }
) {
	const GymVaultsBank = await getContractFactory("GymVaultsBankProxy");
	const gymVaultsBank = await deployProxy(GymVaultsBank, [startblock, gymTokenAddress, rewardRate], {
		unsafeAllowCustomTypes: true
	});
	await gymVaultsBank.deployed();
	console.log(gymVaultsBank.address);
	return gymVaultsBank;
};
