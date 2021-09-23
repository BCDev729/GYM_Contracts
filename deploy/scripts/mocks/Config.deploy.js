const { contractDeploy } = require("../../utils");

module.exports = async function (hre) {
    const chainId = await getChainId();
    if (chainId === "31337") {
        const WBNB = await ethers.getContract("WBNBMock");
        let options = {
            contractName: "Config",
            args: [WBNB.address],
        };

        await contractDeploy(hre, options);
    }
};

module.exports.tags = ["Config"];
module.exports.dependencies = ["WBNBMock"];
