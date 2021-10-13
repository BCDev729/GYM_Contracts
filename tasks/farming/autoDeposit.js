module.exports = async function (
	{ pid, amount, amountTokenMin, amountBNBMin, minAmountOutA, recipient, deadline, caller, bnbAmount },
	{ ethers: { getNamedSigners, getContract } }
) {
	if (deadline === "0") {
		deadline = new Date().getTime() + 20;
	}
	const signers = await getNamedSigners();

	caller = signers[caller];
	recipient = signers[recipient];

	const farming = await getContract("GymFarming", caller);

	const tx = await farming.autoDeposit(
		pid,
		amount,
		amountTokenMin,
		amountBNBMin,
		minAmountOutA,
		recipient.address,
		deadline,
		{
			value: bnbAmount
		}
	);
	const accRewardPerShare = (await farming.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await farming.poolInfo(pid)).lastRewardBlock;
	const userAmount = (await farming.userInfo(pid, recipient.address)).amount;
	const userRewardDebt = (await farming.userInfo(pid, recipient.address)).rewardDebt;

	return { tx, poolInfo: { accRewardPerShare, lastRewardBlock }, userInfo: { userAmount, userRewardDebt } };
};
