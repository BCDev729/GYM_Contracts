const { VARIABLES } = require("../../../utils/constants");

module.exports = async function ({ getChainId, run, ethers }) {
	const chainId = await getChainId();
	if (chainId === "31337") {
		await run("deploy:tokensMock", {
			contractName: "WantToken1",
			symbol: "WT1",
			supply: `${ethers.utils.parseEther("100000000")}`
		});

		await run("deploy:tokensMock", {
			contractName: "WantToken2",
			symbol: "WT2",
			supply: `${VARIABLES.hardhat.TEST_WANTTOKEN2_AMOUNT}`
		});

		await run("deploy:tokensMock", {
			contractName: "EarnToken",
			symbol: "ET",
			supply: `${VARIABLES.hardhat.TEST_TOKENS_MINT_AMOUNT}`
		});

		// const options4 = {
		// 	contractName: "TokenA",
		// 	contractFactory: "ERC20Mock",
		// 	args: ["TokenA", "TA", VARIABLES.hardhat.TEST_TOKENS_MINT_AMOUNT]
		// };
		await run("deploy:tokensMock", {
			contractName: "TokenA",
			symbol: "TA",
			supply: `${VARIABLES.hardhat.TEST_TOKENS_MINT_AMOUNT}`
		});

		await run("deploy:tokensMock", {
			contractName: "TokenB",
			symbol: "TB",
			supply: `${VARIABLES.hardhat.TEST_TOKENS_MINT_AMOUNT}`
		});

		await run("deploy:tokensMock", {
			contractName: "ibToken",
			symbol: "IT",
			supply: `${VARIABLES.hardhat.TEST_TOKENS_MINT_AMOUNT}`
		});
	}
};

module.exports.tags = ["Tokens"];
module.exports.dependencies = [];
