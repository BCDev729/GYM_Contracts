const args = require("../../utils/constants/data/hardhat/GymVaultsBank.json");
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
		utils: { parseEther },
		provider: { getBlockNumber }
	}
}) {
	const chainId = await getChainId();
	if (chainId !== "31337" || forking.enabled) {
		return;
	}
	const startBlock = args.startBlock;
	const gymToken = await getContract("GymToken");
	const rewardRate = parseEther(args.rewardRate);

	await run("deploy:gymVaultsBank", {
		startblock: startBlock.toString(),
		gymtokenaddress: gymToken.address,
		rewardrate: rewardRate.toString()
	});

};
module.exports.tags = ["GymVaultsBank", "Hardhat"];
module.exports.dependencies = ["GymToken", "BuyBack", "GymMLM"];
