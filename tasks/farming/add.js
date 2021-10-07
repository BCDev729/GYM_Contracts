
module.exports = async function (
	{ allocPoint, lpToken, withUpdate, caller },
	{
		ethers: {
			getNamedSigners,
			getContract,
		},
	}
) {
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[caller]);

	withUpdate = (withUpdate === "true");
	allocPoint = parseInt(allocPoint);
	const tx = await farming.add(allocPoint, lpToken, withUpdate);

	return tx;
};