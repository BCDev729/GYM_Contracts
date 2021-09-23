const { ethers } = require("ethers");
const { contractDeploy } = require("../../utils");
const { VARIABLES } = require("../../../utils");

module.exports = async function (hre) {
    const chainId = await getChainId();
    if (chainId === "31337") {
        let options1 = {
            contractName: "WantToken1",
            contractFactory: "ERC20Mock",
            args: ["WantToken1", "WT1", ethers.utils.parseEther("100000000")],
        };

        let options2 = {
            contractName: "WantToken2",
            contractFactory: "ERC20Mock",
            args: ["WantToken2", "WT2", VARIABLES.hardhat.TEST_WANTTOKEN2_AMOUNT],
        };

        let options3 = {
            contractName: "EarnToken",
            contractFactory: "ERC20Mock",
            args: ["EarnToken", "ET", VARIABLES.hardhat.TEST_TOKENS_MINT_AMOUNT],
        };

        let options4 = {
            contractName: "TokenA",
            contractFactory: "ERC20Mock",
            args: ["TokenA", "TA", VARIABLES.hardhat.TEST_TOKENS_MINT_AMOUNT],
        };

        let options5 = {
            contractName: "TokenB",
            contractFactory: "ERC20Mock",
            args: ["TokenB", "TB", VARIABLES.hardhat.TEST_TOKENS_MINT_AMOUNT],
        };

        let options6 = {
            contractName: "ibToken",
            contractFactory: "ERC20Mock",
            args: ["ibToken", "IT", VARIABLES.hardhat.TEST_TOKENS_MINT_AMOUNT],
        };

        await contractDeploy(hre, options1);
        await contractDeploy(hre, options2);
        await contractDeploy(hre, options3);
        await contractDeploy(hre, options4);
        await contractDeploy(hre, options5);
        await contractDeploy(hre, options6);
    }
};

module.exports.tags = ["Tokens"];
module.exports.dependencies = [];
