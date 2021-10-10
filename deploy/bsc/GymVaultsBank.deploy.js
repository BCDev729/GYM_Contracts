const args = require("../../utils/constants/data/bsc-testnet/GymVaultsBank.json");

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
		gymTokenAddress: gymToken.address,
		rewardRate: rewardRate.toString()
	});
};
module.exports.tags = ["GymVaultsBankProxy", "Proxy"];
module.exports.dependencies = ["GymToken", "BuyBack"];
