module.exports = async function (
	{ pid, tokenAmount, amountAMin, amountBMin, minAmountOutA, deadline, caller, bnbAmount },
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

	const tx = await farming.speedStake(pid, tokenAmount, amountAMin, amountBMin, minAmountOutA, deadline, {
		value: bnbAmount,
	});

	return tx;
};
