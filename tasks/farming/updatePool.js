module.exports = async function (
	{ pid, caller },
	{
		ethers: {
			getNamedSigners,
			getContract,
		},
	}
) {
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[caller]);

	pid = parseInt(pid);

	const tx = await farming.updatePool(pid);

	return tx;
};
