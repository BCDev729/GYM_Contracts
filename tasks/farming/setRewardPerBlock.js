module.exports = async function (
	{ deployer },
	{
		ethers: {
			getNamedSigners,
			getContract,
		},
	}
) {
	const signers = await getNamedSigners();
	const farming = await getContract("GymFarming", signers[deployer]);

	const tx = await farming.setRewardPerBlock();
	return tx;
};