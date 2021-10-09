module.exports = async function (
	{ allocPoint, lpToken, withUpdate, caller },
	{ ethers: { getNamedSigners, getContract } }
) {
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[caller]);

	withUpdate = withUpdate === "true";
	allocPoint = parseInt(allocPoint);
	const tx = await farming.add(allocPoint, lpToken, withUpdate);
	const totalAllocPoint = await farming.totalAllocPoint();
	const pid = (await farming.poolLength()) - 1;
	const accRewardPerShare = (await farming.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await farming.poolInfo(pid)).lastRewardBlock;

	return { tx, poolInfo: { accRewardPerShare, lastRewardBlock }, totalAllocPoint };
};
