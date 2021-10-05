const args = require("../../utils/constants/data/bsc-testnet/GymFarming.json");
module.exports = async function ({
	run,
	getChainId,
	ethers: {
		getContract,
		utils: { parseEther },
		provider: { getBlockNumber }
	}
}) {
	const chainId = await getChainId();
	if (chainId !== "97") {
		return;
	}
	const blockNumber = await getBlockNumber();
	const bank = await getContract("GymVaultsBank");
	const rewardToken = await getContract("GymToken");
	const rewardPerBlock = parseEther(args.rewardPerBlock);
	const startBlock = blockNumber + args.startBlock;

	const options = {
		contractName: "GymFarming",
		args: [bank.address, rewardToken.address, rewardPerBlock, startBlock]
	};

	const deterministicDeploy = await run("deploy:farming", {
		bankAddress: bank.address,
		rewardTokenAddress: rewardToken.address,
		rewardPerBlock: rewardPerBlock.toString(),
		startBlock: startBlock.toString()
	});

	try {
		await run("verify:verify", {
			address: deterministicDeploy.address,
			constructorArguments: options.args
		});
	} catch (e) {
		console.log(e.toString());
	}
};

module.exports.tags = ["Farming"];
module.exports.dependencies = ["GymVaultsBank"];
