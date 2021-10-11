module.exports = async function ({ pid, user, caller }, { ethers: { getNamedSigners, getContract } }) {
	const gymVaultsBank = await getContract("GymVaultsBank");
	const signers = await getNamedSigners();
	user = signers[user];
	const tx = await gymVaultsBank.pendingReward(pid, user.address);

	return tx;
};
