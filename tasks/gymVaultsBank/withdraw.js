module.exports = async function ({ pid, wantAmt, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const withdrawTx = await gymVaultsBank.connect(signers[caller]).withdraw(pid, wantAmt);

	const newAccRewardPerShare = (await gymVaultsBank.poolInfo(pid)).accRewardPerShare;

	const newRewardDebt = (await gymVaultsBank.userInfo(pid, signers[caller].address)).rewardDebt;

	const newUserShares = (await gymVaultsBank.userInfo(pid, signers[caller].address)).shares;

	return { withdrawTx, pid, newAccRewardPerShare, newRewardDebt, newUserShares };
};
