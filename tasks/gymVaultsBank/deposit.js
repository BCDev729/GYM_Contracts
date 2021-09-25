module.exports = async function (
	{ pid, wantAmt, referrerId, minBurnAmt, deadline, caller, bnbAmount },
	{ ethers: { getNamedSigners, getContract } }
) {
	if (deadline === "0") {
		deadline = new Date().getTime() + 20;
	}
	const signers = await getNamedSigners();

	const gymVaultsBank = await getContract("GymVaultsBank", signers[caller]);

	const tx = await gymVaultsBank.connect(signers[caller]).deposit(pid, wantAmt, referrerId, minBurnAmt, deadline, {
		value: bnbAmount
	});

	return tx;
};
