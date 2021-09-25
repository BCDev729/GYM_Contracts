module.exports = async function ({ getChainId, run }) {
	const chainId = await getChainId();

	if (chainId === "31337") {
		await run("deploy:fairLaunchMock");
	}
};

module.exports.tags = ["FairLaunchMock"];
module.exports.dependencies = [];
