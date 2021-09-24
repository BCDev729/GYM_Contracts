module.exports = async function (
	{ want, allocPoint, withUpdate, strategy, caller },
	{ ethers: { getNamedSigners, getContract } }
) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).add(want, allocPoint, withUpdate, strategy);

	return tx;
};
