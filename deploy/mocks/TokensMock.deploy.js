const testVars = require("../../test/utilities/testVariables.json");

module.exports = async function ({ getChainId, run, ethers, config }) {
	const chainId = await getChainId();
	if (chainId === "31337" && !config.networks.hardhat.forking.enabled) {
		await run("deploy:tokensMock", {
			contractName: "WantToken1",
			symbol: "WT1",
			supply: `${ethers.utils.parseEther("100000000")}`
		});

		await run("deploy:tokensMock", {
			contractName: "WantToken2",
			symbol: "WT2",
			supply: `${testVars.TOKENS_MINT_AMOUNT}`
		});

		await run("deploy:tokensMock", {
			contractName: "EarnToken",
			symbol: "ET",
			supply: `${testVars.TOKENS_MINT_AMOUNT}`
		});

		await run("deploy:tokensMock", {
			contractName: "TokenA",
			symbol: "TA",
			supply: `${testVars.TOKENS_MINT_AMOUNT}`
		});

		await run("deploy:tokensMock", {
			contractName: "TokenB",
			symbol: "TB",
			supply: `${testVars.TOKENS_MINT_AMOUNT}`
		});

		await run("deploy:tokensMock", {
			contractName: "ibToken",
			symbol: "IT",
			supply: `${testVars.TOKENS_MINT_AMOUNT}`
		});
	}
};

module.exports.tags = ["Tokens"];
module.exports.dependencies = [];
