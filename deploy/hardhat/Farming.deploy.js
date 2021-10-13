const args = require("../../utils/constants/data/hardhat/GymFarming.json");
module.exports = async function ({
	config,
	run,
	getChainId,
	ethers: {
		getContract,
		utils: { parseEther }
	}
}) {
	if(config.networks.hardhat.forking.enabled) return;

	const bank = await getContract("GymVaultsBank");
	const rewardToken = await getContract("GymToken");
	const rewardPerBlock = parseEther(args.rewardPerBlock);
	const startBlock = args.startBlock;

	await run("deploy:farming", {
		bankAddress: bank.address,
		rewardTokenAddress: rewardToken.address,
		rewardPerBlock: rewardPerBlock.toString(),
		startBlock: startBlock.toString()
	});

};

module.exports.tags = ["Farming", "Hardhat"];
module.exports.dependencies = ["GymVaultsBank"];
