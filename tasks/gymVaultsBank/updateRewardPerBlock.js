module.exports = async function ({ caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).updateRewardPerBlock();

	const newRewardPerBlock = Math.floor((await gymVaultsBank.rewardPoolInfo()).rewardPerBlock);

	return { tx, newRewardPerBlock };
};
