module.exports = async function ({ ethers: { getContract }, getChainId, run }) {
	const chainId = await getChainId();

	if (chainId === "31337") {
		const want = await getContract("WantToken1");
		await run("deploy:vaultMock", {
			wantAddress: want.address
		});
	}
};
module.exports.tags = ["VaultMock"];
module.exports.dependencies = ["Tokens"];
