const args = require("../../utils/constants/data/hardhat/GymVaultsBank.json");
module.exports = async function ({
	config,
	run,
	ethers: {
		getContract,
		utils: { parseEther },
		provider: { getBlockNumber }
	}
}) {
	if(config.networks.hardhat.forking.enabled) return;

	const startBlock = args.startBlock;
	const gymToken = await getContract("GymToken");
	const rewardRate = parseEther(args.rewardRate);

	await run("deploy:gymVaultsBank", {
		startblock: startBlock.toString(),
		gymTokenAddress: gymToken.address,
		rewardRate: rewardRate.toString()
	});

};
module.exports.tags = ["GymVaultsBank", "Hardhat"];
module.exports.dependencies = ["GymToken", "BuyBack", "GymMLM"];
