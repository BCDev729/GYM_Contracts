module.exports = async function ({
	ethers: { getContract },
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
		const want = await getContract("WantToken1");
		await run("deploy:vaultMock", {
			wantAddress: want.address
		});
	}
};
module.exports.tags = ["VaultMock", "Hardhat"];
module.exports.dependencies = ["Tokens"];
