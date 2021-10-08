module.exports = async function ({ pid, allocPoint, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).set(pid, allocPoint);

	return { tx, pid, allocPoint };
};
