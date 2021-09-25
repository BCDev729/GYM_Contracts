module.exports = async function ({ getChainId, ethers: { getContract }, run }) {
	const chainId = await getChainId();
	if (chainId === "31337") {
		const WBNB = await getContract("WBNBMock");
		await run("deploy:config", {
			wbnbAddress: WBNB.address
		});
	}
};

module.exports.tags = ["Config"];
module.exports.dependencies = ["WBNBMock"];
