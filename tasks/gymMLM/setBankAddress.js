module.exports = async function ({ bankAddress, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymMLM = await getContract("GymMLM", signers[caller]);

	const tx = await gymMLM.connect(signers[caller]).setBankAddress(bankAddress);

	return { tx };
};
