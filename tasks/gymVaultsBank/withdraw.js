module.exports = async function ({ pid, wantAmt, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).withdraw(pid, wantAmt);

	const newAccRewardPerShare = (await gymVaultsBank.poolInfo(pid)).accRewardPerShare;

	const newRewardDebt = (await gymVaultsBank.userInfo(pid, signers[caller].address)).rewardDebt;

	const userShares = (await gymVaultsBank.userInfo(pid, signers[caller].address)).shares;

	return { tx, newAccRewardPerShare, newRewardDebt, userShares };
};
