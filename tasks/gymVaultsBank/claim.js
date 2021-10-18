module.exports = async function (
	{ pid, caller },
	{ ethers: { getNamedSigners, getContract } }
) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).claim(pid);

	const accRewardPerShare = (await gymVaultsBank.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await gymVaultsBank.poolInfo(pid)).lastRewardBlock;
	const userRewardDebt = (await gymVaultsBank.userInfo(pid, signers[caller].address)).rewardDebt;

	return { tx, poolInfo: { accRewardPerShare, lastRewardBlock }, userInfo: { userRewardDebt } };
};
