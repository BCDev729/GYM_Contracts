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

	if (chainId === "31337") {
		const want = await getContract("WantToken1");

		await run("deploy:routerMock", {
			wantAddress: want.address
		});
	}
};

module.exports.tags = ["RouterMock", "Hardhat", "Fork"];
module.exports.dependencies = ["Tokens"];
