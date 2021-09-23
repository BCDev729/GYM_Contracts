const { VARIABLES } = require("../../../utils");
const { contractDeploy } = require("../../utils");

module.exports = async function (hre) {
    const chainId = await getChainId();

    if (chainId === "31337") {
        await contractDeploy(hre, "WBNBMock");

        const wbnb = await ethers.getContract("WBNBMock");

        VARIABLES.hardhat.GYM_VAULTS_BANK_CORE_POOL_WANT_ADDRESS = wbnb.address;
    }
};

module.exports.tags = ["WBNBMock"];
module.exports.dependencies = [];
