module.exports = async function (
	{ pid, amount, amountTokenMin, amountBNBMin, minAmountOutA, recipient, deadline, caller, bnbAmount },
	{
		ethers: {
			getNamedSigners,
			getContract,
			provider: { getBlockNumber },
		},
	}
) {
	if (deadline === "0") {
		deadline = (await getBlockNumber()) + 10000000;
	}
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[caller]);

	await farming.autoDeposit(
		pid,
		amount,
		amountTokenMin,
		amountBNBMin,
		minAmountOutA,
		signers[recipient].address,
		deadline,
		{
			value: bnbAmount,
		}
	);
};
