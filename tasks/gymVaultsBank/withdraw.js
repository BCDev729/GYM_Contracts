module.exports = async function ({ pid, wantAmt, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).withdraw(pid, wantAmt);

	return tx;
};
