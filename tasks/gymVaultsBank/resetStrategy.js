module.exports = async function ({ pid, strategy, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).resetStrategy(pid, strategy);

	return { tx, pid, strategy };
};
