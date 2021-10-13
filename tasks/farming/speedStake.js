module.exports = async function (
	{ pid, tokenAmount, amountAMin, amountBMin, minAmountOutA, deadline, caller, bnbAmount },
	{ ethers: { getNamedSigners, getContract } }
) {
	if (deadline === "0") {
		deadline = new Date().getTime() + 20;
	}
	const signers = await getNamedSigners();

	caller = signers[caller];

	const farming = await getContract("GymFarming", caller);

	const tx = await farming.speedStake(pid, tokenAmount, amountAMin, amountBMin, minAmountOutA, deadline, {
		value: bnbAmount
	});

	const accRewardPerShare = (await farming.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await farming.poolInfo(pid)).lastRewardBlock;
	const userAmount = (await farming.userInfo(pid, caller.address)).amount;
	const userRewardDebt = (await farming.userInfo(pid, caller.address)).rewardDebt;

	return { tx, poolInfo: { accRewardPerShare, lastRewardBlock }, userInfo: { userAmount, userRewardDebt } };
};
