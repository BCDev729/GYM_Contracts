module.exports = async function ({
	getChainId,
	run,
	config: {
		networks: {
			hardhat: { forking }
		}
	}
}) {
	const chainId = await getChainId();

	if (chainId === "31337" && !forking.enabled) {
		await run("deploy:wbnb");
	}
};

module.exports.tags = ["WBNBMock", "Hardhat"];
module.exports.dependencies = [];
