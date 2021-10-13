module.exports = async function (
	{ pid, amountTokenMin, amountETHMIn, minAmountOut, deadline, caller },
	{ ethers: { getNamedSigners, getContract } }
) {
	if (deadline === "0") {
		deadline = new Date().getTime() + 20;
	}
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank
		.connect(signers[caller])
		.claimAndDeposit(pid, amountTokenMin, amountETHMIn, minAmountOut, deadline);

	const accRewardPerShare = (await gymVaultsBank.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await gymVaultsBank.poolInfo(pid)).lastRewardBlock;
	const userShares = (await gymVaultsBank.userInfo(pid, signers[caller].address)).shares;
	const userRewardDebt = (await gymVaultsBank.userInfo(pid, signers[caller].address)).rewardDebt;

	return { tx, poolInfo: { accRewardPerShare, lastRewardBlock }, userInfo: { userShares, userRewardDebt } };
};
