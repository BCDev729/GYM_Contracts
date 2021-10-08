module.exports = async function ({ caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).updateRewardPerBlock();

	const newRewardPerBlock = (await gymVaultsBank.rewardPoolInfo).rewardPerBlock;
	const newRewardPerBlockChangesCount = await gymVaultsBank.rewardPerBlockChangesCount;
	const newLastChangeBlock = await gymVaultsBank.lastChangeBlock;

	return { tx, newRewardPerBlock, newRewardPerBlockChangesCount, newLastChangeBlock };
};
