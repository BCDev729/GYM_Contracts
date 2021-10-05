module.exports = async function ({ getChainId, run }) {
	const chainId = await getChainId();
	if (chainId === "31337") {
		await run("deploy:bankMock");
	}
};

module.exports.tags = ["BankMock"];
module.exports.dependencies = ["Tokens"];
