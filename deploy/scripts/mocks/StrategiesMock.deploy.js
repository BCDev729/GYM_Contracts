const { VARIABLES } = require("../../../utils");

const { contractDeploy } = require("../../utils");

module.exports = async function (hre) {
    accounts = await ethers.getNamedSigners();
    const chainId = await getChainId();

    if (chainId === "31337") {
        const WBNB = await ethers.getContract("WBNBMock");
        const wantToken1 = await ethers.getContract("WantToken1");
        const wantToken2 = await ethers.getContract("WantToken2");

        let options1 = {
            contractName: "StrategyMock1",
            contractFactory: "StrategyMock",
            args: [wantToken1.address],
        };

        let options2 = {
            contractName: "StrategyMock2",
            contractFactory: "StrategyMock",
            args: [wantToken2.address],
        };

        let options3 = {
            contractName: "StrategyMock3",
            contractFactory: "StrategyMock",
            args: [wantToken2.address],
        };

        let options = {
            contractName: "StrategyMock",
            args: [WBNB.address],
        };

        await contractDeploy(hre, options1);
        await contractDeploy(hre, options2);
        await contractDeploy(hre, options3);
        await contractDeploy(hre, options, async (contract) => {
            VARIABLES.hardhat.GYM_VAULTS_BANK_CORE_POOL_STRATEGY_ADDRESS = contract.address;
        });
    }
};

module.exports.tags = ["Strategies"];
module.exports.dependencies = ["Tokens", "WBNBMock"];
