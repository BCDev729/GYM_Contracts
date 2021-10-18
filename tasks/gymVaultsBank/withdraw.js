module.exports = async function ({ pid, wantAmt, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).withdraw(pid, wantAmt);


	const accRewardPerShare = (await gymVaultsBank.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await gymVaultsBank.poolInfo(pid)).lastRewardBlock;
	const userShares = (await gymVaultsBank.userInfo(pid, signers[caller].address)).shares;
	const userRewardDebt = (await gymVaultsBank.userInfo(pid, signers[caller].address)).rewardDebt;

	return { tx, poolInfo: { accRewardPerShare, lastRewardBlock }, userInfo: { userShares, userRewardDebt } };
};
