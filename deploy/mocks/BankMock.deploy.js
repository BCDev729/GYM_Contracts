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
		await run("deploy:bankMock");
	}
};

module.exports.tags = ["BankMock"];
module.exports.dependencies = ["Tokens"];
