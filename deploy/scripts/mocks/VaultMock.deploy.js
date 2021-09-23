const { contractDeploy } = require("../../utils");

module.exports = async function (hre) {
    const chainId = await getChainId();

    if (chainId === "31337") {
        const want = await ethers.getContract("WantToken1");
        let options = {
            contractName: "VaultMock",
            args: [want.address],
        };

        await contractDeploy(hre, options);
    }
};

module.exports.tags = ["VaultMock"];
module.exports.dependencies = ["Tokens"];
