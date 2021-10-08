const args = require("../../utils/constants/data/hardhat/GymFarming.json");
module.exports = async function ({
	config: {
		networks: {
			hardhat: { forking }
		}
	},
	run,
	getChainId,
	ethers: {
		getContract,
		utils: { parseEther }
	}
}) {
	const chainId = await getChainId();
	if (chainId !== "31337" || forking.enabled) {
		return;
	}
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
