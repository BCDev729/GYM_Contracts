module.exports = async function ({ pid, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[caller]);

	pid = parseInt(pid);

	const tx = await farming.updatePool(pid);

	const accRewardPerShare = (await farming.poolInfo(pid)).accRewardPerShare;
	const lastRewardBlock = (await farming.poolInfo(pid)).lastRewardBlock;

	return { tx, poolInfo: { accRewardPerShare, lastRewardBlock } };
};
