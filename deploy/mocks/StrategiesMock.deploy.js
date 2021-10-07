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
		const WBNB = await getContract("WBNBMock");
		const wantToken1 = await getContract("WantToken1");
		const wantToken2 = await getContract("WantToken2");

		await run("deploy:strategyMock", {
			contractName: "StrategyMock1",
			wantAddress: wantToken1.address
		});

		await run("deploy:strategyMock", {
			contractName: "StrategyMock2",
			wantAddress: wantToken2.address
		});

		await run("deploy:strategyMock", {
			contractName: "StrategyMock3",
			wantAddress: wantToken2.address
		});

		await run("deploy:strategyMock", {
			contractName: "StrategyMock",
			wantAddress: WBNB.address
		});
	}
};

module.exports.tags = ["Strategies", "Hardhat"];
module.exports.dependencies = ["Tokens", "WBNBMock"];
