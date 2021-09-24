module.exports = async function (
	{ pid, wantAmt, caller },
	{
		ethers: {
			getNamedSigners,
			getContract,
			provider: { getBlockNumber }
		}
	}
) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).withdraw(pid, wantAmt);

	return tx;
};
