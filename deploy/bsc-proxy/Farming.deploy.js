const args = require("../../utils/constants/data/bsc/GymFarming.json");

module.exports = async function ({
	run,
	ethers: {
		getContract,
		utils: { parseEther },
		provider: { getBlockNumber }
	}
}) {
	const blockNumber = await getBlockNumber();
	const rewardToken = await getContract("GymToken");
	const rewardPerBlock = parseEther(args.rewardPerBlock);
	const startBlock = blockNumber + args.startBlock;
	const { proxies } = require("./../../.openzeppelin/unknown-56.json");

	await run("deploy:farming", {
		bankAddress: proxies[proxies.length - 1].address,
		rewardTokenAddress: rewardToken.address,
		rewardPerBlock: rewardPerBlock.toString(),
		startBlock: startBlock.toString()
	});
};

module.exports.tags = ["Farming", "Proxy"];
module.exports.dependencies = ["GymVaultsBankProxy"];
