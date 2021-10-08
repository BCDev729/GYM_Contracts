const args = require("../../utils/constants/data/fork/GymFarming.json");
module.exports = async function ({
	config: {
		networks: { hardhat: {forking} }
	},
	run,
	getChainId,
	ethers: {
		getContract,
		provider: { getBlockNumber },
		utils: { parseEther }
	}
}) {
	const chainId = await getChainId();
	if (chainId !== "31337" || !forking.enabled) {
		return;
	}
	const blockNumber = await getBlockNumber();
	const bank = await getContract("GymVaultsBank");
	const rewardToken = await getContract("GymToken");
	const rewardPerBlock = parseEther(args.rewardPerBlock);
	const startBlock = blockNumber + args.startBlock;

	await run("deploy:farming", {
		bankAddress: bank.address,
		rewardTokenAddress: rewardToken.address,
		rewardPerBlock: rewardPerBlock.toString(),
		startBlock: startBlock.toString()
	});
};

module.exports.tags = ["Farming", "Fork"];
module.exports.dependencies = ["GymVaultsBank"];
