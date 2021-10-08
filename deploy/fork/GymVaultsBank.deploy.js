const args = require("../../utils/constants/data/fork/GymVaultsBank.json");
module.exports = async function ({
	config,
	run,
	ethers: {
		getContract,
		utils: { parseEther },
		provider: { getBlockNumber }
	}
}) {
	if(!config.networks.hardhat.forking.enabled) return;
	
	const blockNumber = await getBlockNumber();
	const startBlock = blockNumber + args.startBlock;
	const gymToken = await getContract("GymToken");
	const rewardRate = parseEther(args.rewardRate);

	await run("deploy:gymVaultsBank", {
		startblock: startBlock.toString(),
		gymtokenaddress: gymToken.address,
		rewardrate: rewardRate.toString()
	});
};
module.exports.tags = ["GymVaultsBank", "Fork"];
module.exports.dependencies = ["GymToken", "BuyBack", "GymMLM"];
