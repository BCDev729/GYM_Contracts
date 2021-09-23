const { contractDeploy } = require("../../utils");

module.exports = async function (hre) {
    const chainId = await getChainId();

    if (chainId === "31337") {
        await contractDeploy(hre, "FairLaunchMock");
    }
};

module.exports.tags = ["FairLaunchMock"];
module.exports.dependencies = [];
