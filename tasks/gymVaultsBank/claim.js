module.exports = async function (
	{ pid, caller },
	{ ethers: { getNamedSigners, getContract } }
) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).claim(pid);

	return tx;
};
