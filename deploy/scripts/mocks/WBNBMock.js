const { VARIABLES } = require("../../../utils/constants");

module.exports = async function ({ethers: {getContract}, getChainId}) {
	const chainId = await getChainId();

	if (chainId === "31337") {
		await run("deploy:wbnb");

		const wbnb = await getContract("WBNBMock");

		VARIABLES.hardhat.GYM_VAULTS_BANK_CORE_POOL_WANT_ADDRESS = wbnb.address;
	}
};

module.exports.tags = ["WBNBMock"];
module.exports.dependencies = [];
