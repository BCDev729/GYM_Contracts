module.exports = async function ({ treasuryAddress, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).setTreasuryAddress(treasuryAddress);

	return { tx, treasuryAddress };
};
