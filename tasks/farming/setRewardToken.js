module.exports = async function ({ token, caller }, { ethers: { getNamedSigners, getContract } }) {
	const signers = await getNamedSigners();
	const farming = await getContract("GymFarming", signers[caller]);

	const tx = await farming.setRewardToken(token.address);

	const rewardToken = await farming.rewardToken();

	return { tx, rewardToken };
};
