module.exports = async function (
	{ from, to, caller },
	{
		ethers: {
			getNamedSigners,
			getContract,
		},
	}
) {
	const signers = await getNamedSigners();
	const farming = await getContract("GymFarming", signers[caller]);

	from = parseInt(from);
	to = parseInt(to);

	const tx = await farming.getMultiplier(
		from,
		to
	);
	return tx;
};