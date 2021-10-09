const args = require("../../utils/constants/data/bsc/GymVaultsBank.json");

module.exports = async function ({
	run,
	ethers: {
		getContract,
		utils: { parseEther },
		provider: { getBlockNumber }
	}
}) {
	const blockNumber = await getBlockNumber();
	const startBlock = blockNumber + args.startBlock;
	const gymToken = await getContract("GymToken");
	const rewardRate = parseEther(args.rewardRate);

	await run("deploy:gymVaultsBankProxy", {
		startblock: startBlock.toString(),
		gymtokenaddress: gymToken.address,
		rewardrate: rewardRate.toString()
	});
};
module.exports.tags = ["GymVaultsBank", "Proxy"];
module.exports.dependencies = ["GymToken", "BuyBack"];
