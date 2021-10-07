module.exports = async function (
	{ pid, user },
	{ ethers: { getContract } }
) {

	const gymVaultsBank = await getContract("GymVaultsBank");

	const tx = await gymVaultsBank.stakedWantTokens(pid, user);

	return tx;
};
