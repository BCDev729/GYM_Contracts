module.exports = async function (
	{ pid, amountAMin, amountBMin, minAmountOutA, deadline, caller, bnbAmount },
	{
		ethers: {
			getNamedSigners,
			getContract
		},
	}
) {
	if (deadline === "0") {
		deadline = new Date().getTime() + 20;
	}
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[caller]);

	const tx = await farming.claimAndDeposit(pid, amountAMin, amountBMin, minAmountOutA, deadline, {
		value: bnbAmount,
	});

	const accRewardPerShare = (await farming.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await farming.poolInfo(pid)).lastRewardBlock;
	const userAmount = (await farming.userInfo(pid, signers[caller].address)).amount;
	const userRewardDebt = (await farming.userInfo(pid, signers[caller].address)).rewardDebt;


	return {tx, poolInfo: { accRewardPerShare, lastRewardBlock }, UserInfo: { userAmount, userRewardDebt }};
};
