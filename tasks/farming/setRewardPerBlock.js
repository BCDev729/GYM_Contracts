module.exports = async function (
	{ caller },
	{
		ethers: {
			getNamedSigners,
			getContract,
		},
	}
) {
	const signers = await getNamedSigners();
	const farming = await getContract("GymFarming", signers[caller]);

	const tx = await farming.setRewardPerBlock();

	const rewardPerBlock = await farming.rewardPerBlock();

	return {tx, rewardPerBlock};
};