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
	const startBlock = blockNumber + 200;
	const gymToken = await getContract("GymToken");
	const rewardRate = parseEther("25.72864");

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
module.exports.tags = ["GymVaultsBank"];
module.exports.dependencies = ["GymToken", "BuyBack"];
