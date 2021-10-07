module.exports = async function (
	{ user },
	{
		ethers: {
			getNamedSigners,
			getContract,
		},
	}
) {
	const signers = await getNamedSigners();
	const farming = await getContract("GymFarming", signers[0]);

	const tx = await farming.pendingRewardBlock(user.address);
	return tx;
};