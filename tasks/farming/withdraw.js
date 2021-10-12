module.exports = async function ({ pid, amount, caller }, { ethers: { getNamedSigners, getContract, BigNumber } }) {
	const signers = await getNamedSigners();

	caller = signers[caller];

	const farming = await getContract("GymFarming", caller);

	pid = parseInt(pid);
	amount = BigNumber.from(amount);

	const tx = await farming.withdraw(pid, amount);

	const accRewardPerShare = (await farming.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await farming.poolInfo(pid)).lastRewardBlock;
	const userAmount = (await farming.userInfo(pid, caller.address)).amount;
	const userRewardDebt = (await farming.userInfo(pid, caller.address)).rewardDebt;

	return { tx, poolInfo: { accRewardPerShare, lastRewardBlock }, userInfo: { userAmount, userRewardDebt } };
};
