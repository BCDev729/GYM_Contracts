module.exports = async function ({ pid, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();
	
	caller = signers[caller];

	const farming = await getContract("GymFarming", caller);
	

	pid = parseInt(pid);

	const tx = await farming.harvest(pid);

	const accRewardPerShare = (await farming.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await farming.poolInfo(pid)).lastRewardBlock;
	const userRewardDebt = (await farming.userInfo(pid, caller.address)).rewardDebt;

	return { tx, poolInfo: { accRewardPerShare, lastRewardBlock }, userInfo: { userRewardDebt } };
};
