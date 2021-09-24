module.exports = async function (
	{ pid, user, caller },
	{ ethers: { getNamedSigners, getContract } }
) {
	const gymVaultsBank = await getContract("GymVaultsBank");

	const tx = await gymVaultsBank.pendingReward(pid, user);

	return tx;
};
