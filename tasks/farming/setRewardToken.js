module.exports = async function (
	{ token, deployer },
	{
		ethers: {
			getNamedSigners,
			getContract,
		},
	}
) {
	const signers = await getNamedSigners();
	const farming = await getContract("GymFarming", signers[deployer]);

	const tx = await farming.getRewardToken(token.address);
	return tx;
};