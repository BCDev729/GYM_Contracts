module.exports = async function (
	{ startblock, gymtokenaddress, rewardrate },
	{ ethers: { getContractFactory }, upgrades: { deployProxy } }
) {

	const GymVaultsBank = await getContractFactory("GymVaultsBankProxy");
	const gymVaultsBank = await deployProxy(GymVaultsBank, [startblock, gymtokenaddress, rewardrate], { unsafeAllowCustomTypes: true });
	await gymVaultsBank.deployed();
	console.log(gymVaultsBank.address);
	return gymVaultsBank.address;
};
