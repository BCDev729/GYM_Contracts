module.exports = async function (
	{ pid, amountTokenMin, amountETHMIn, minAmountOut, deadline, caller },
	{ ethers: { getNamedSigners, getContract } }
) {
	if (deadline === "0") {
		deadline = new Date().getTime() + 20;
	}
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank
		.connect(signers[caller])
		.claimAndDeposit(pid, amountTokenMin, amountETHMIn, minAmountOut, deadline);
	return tx;
};
