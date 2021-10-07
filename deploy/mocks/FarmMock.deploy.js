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
	if (chainId === "31337" && !forking.enabled) {
		const want = await getContract("WantToken1");
		const earn = await getContract("EarnToken");
		await run("deploy:farmMock", {
			wantAddress: want.address,
			earnAddress: earn.address
		});
	}
};

module.exports.tags = ["FarmMock"];
module.exports.dependencies = ["RouterMock", "BankMock"];
