module.exports = async function (
	{ pid, amount, caller },
	{
		ethers: {
			getNamedSigners,
			getContract,
			BigNumber
		},
	}
) {
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[caller]);

	pid = parseInt(pid);
	amount = BigNumber.from(amount);

	const tx = await farming.withdraw(pid, amount);
	
	return tx;
};
