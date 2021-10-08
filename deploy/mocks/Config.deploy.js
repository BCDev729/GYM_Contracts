module.exports = async function ({
	getChainId,
	ethers: { getContract },
	run,
	config: {
		networks: {
			hardhat: { forking }
		}
	}
}) {
	const chainId = await getChainId();
	if (chainId === "31337" && !forking.enabled) {
		const WBNB = await getContract("WBNBMock");
		await run("deploy:config", {
			wbnbAddress: WBNB.address
		});
	}
};

module.exports.tags = ["Config", "Hardhat"];
module.exports.dependencies = ["WBNBMock"];
