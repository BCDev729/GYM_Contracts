const { contractDeploy } = require("../../utils");

module.exports = async function (hre) {
    const chainId = await getChainId();
    if (chainId === "31337") {
        const want = await ethers.getContract("WantToken1");
        const earn = await ethers.getContract("EarnToken");
        let options = {
            contractName: "FarmMock",
            args: [want.address, earn.address],
        };

        await contractDeploy(hre, options);
    }
};

module.exports.tags = ["FarmMock"];
module.exports.dependencies = ["RouterMock", "BankMock"];
