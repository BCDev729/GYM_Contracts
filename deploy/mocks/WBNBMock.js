module.exports = async function ({ getChainId, run }) {
	const chainId = await getChainId();

	if (chainId === "31337") {
		await run("deploy:wbnb");
	}
};

module.exports.tags = ["WBNBMock"];
module.exports.dependencies = [];
