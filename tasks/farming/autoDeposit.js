module.exports = async function (
	{ pid, amount, amountTokenMin, amountBNBMin, minAmountOutA, recipient, deadline, caller, bnbAmount },
	{
		ethers: {
			getNamedSigners,
			getContract
		},
	}
) {
	if (deadline === "0") {
		deadline = new Date().getTime() + 20;
	}
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[caller]);

	const tx = await farming.autoDeposit(
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

	return tx;
};
