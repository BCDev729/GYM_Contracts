const args = require("../../utils/constants/data/bsc-testnet/GymFarming.json");

module.exports = async function ({
	run,
	ethers: {
		getContract,
		utils: { parseEther },
		provider: { getBlockNumber }
	}
}) {
	const blockNumber = await getBlockNumber();
	const bank = await getContract("GymVaultsBankProxy");
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

module.exports.tags = ["Farming", "Proxy"];
module.exports.dependencies = ["GymVaultsBank"];
