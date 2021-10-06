module.exports = async function ({ getChainId, run, config }) {
	const chainId = await getChainId();

	if (chainId === "31337" && !config.networks.hardhat.forking.enabled) {
		await run("deploy:wbnb");
	}
};

module.exports.tags = ["WBNBMock"];
module.exports.dependencies = [];
