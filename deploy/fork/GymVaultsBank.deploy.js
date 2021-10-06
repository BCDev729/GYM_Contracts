const args = require("../../utils/constants/data/hardhat/GymVaultsBank.json");
module.exports = async function ({
	run,
	config: { networks: { hardhat: {forking} }},
	getChainId,
	ethers: {
		getContract,
		utils: { parseEther },
		provider: { getBlockNumber }
	}
}) {
	const chainId = await getChainId();
	if (chainId !== "31337" || !forking.enabled) {
		return;
	}
	const blockNumber = await getBlockNumber();
	const startBlock = blockNumber + args.startBlock;
	const gymToken = await getContract("GymToken");
	const rewardRate = parseEther(args.rewardRate);

	const options = {
		contractName: "GymVaultsBank",
		args: [startBlock, gymToken.address, rewardRate]
	};
	const deterministicDeploy = await run("deploy:gymVaultsBank", {
		startblock: startBlock.toString(),
		gymtokenaddress: gymToken.address,
		rewardrate: rewardRate.toString()
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
module.exports.tags = ["GymVaultsBank", "Test"];
module.exports.dependencies = ["GymToken", "BuyBack", "GymMLM"];
