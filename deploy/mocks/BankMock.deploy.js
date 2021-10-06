module.exports = async function ({ getChainId, run, config }) {
	const chainId = await getChainId();
	if (chainId === "31337" && !config.networks.hardhat.forking.enabled) {
		await run("deploy:bankMock");
	}
};

module.exports.tags = ["BankMock"];
module.exports.dependencies = ["Tokens"];
