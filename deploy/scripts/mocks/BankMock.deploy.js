const { contractDeploy } = require("../../utils");

module.exports = async function (hre) {
    const chainId = await hre.getChainId();
    if (chainId === "31337") {
        await contractDeploy(hre, "BankMock");
    }
};

module.exports.tags = ["BankMock"];
module.exports.dependencies = ["Tokens"];
