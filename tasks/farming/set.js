module.exports = async function (
	{ pid, allocPoint, withUpdate, deployer },
	{
		ethers: {
			getNamedSigners,
			getContract,
			BigNumber
		},
	}
) {
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[deployer]);

	pid = parseInt(pid);
	allocPoint = parseInt(allocPoint);
	withUpdate = (withUpdate === "true");

	const tx = await farming.set(pid, BigNumber.from(allocPoint), withUpdate);

	return tx;
};
