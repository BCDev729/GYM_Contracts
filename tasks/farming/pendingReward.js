module.exports = async function ({ pid, user, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();

	const farming = await getContract("GymFarming", signers[caller]);

	pid = parseInt(pid);
	
	const tx = await farming.pendingReward(pid, signers[user].address);

	return tx;
};
