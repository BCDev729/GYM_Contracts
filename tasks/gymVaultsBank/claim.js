module.exports = async function (
	{ pid, caller },
	{ ethers: { getNamedSigners, getContract } }
) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).claim(pid);

	const newAccRewardPerShare = (await gymVaultsBank.poolInfo(pid)).accRewardPerShare;

	const newRewardDebt = (await gymVaultsBank.userInfo(pid, signers[caller].address)).rewardDebt;

	return {tx, newAccRewardPerShare, newRewardDebt};
};
