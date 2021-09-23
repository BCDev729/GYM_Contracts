const {
    expect
} = require("chai");
const {
    deployments,
    network,
    ethers
} = require("hardhat");
const {
    getContract,
    getNamedSigners,
    BigNumber
} = ethers;
const {
    VARIABLES,
    getDeploymentArgs
} = require("../helpers/data/constants")

const variables = VARIABLES.hardhat
let accounts;

describe("GymToken contract: ", function () {
    before("Before All: ", async () => {
        // await deployments.fixture()

        accounts = await getNamedSigners();
        const chainId = await getChainId()

        deploymentArgs = await getDeploymentArgs(chainId, "GymToken");

        await deployments.deploy("GymToken", {
            from: accounts.deployer.address,
            args: [deploymentArgs.holder],
            log: true,
            deterministicDeployment: false
        })
        this.gymToken = await getContract("GymToken", accounts.caller);
        await this.gymToken.connect(accounts.caller).delegate(accounts.caller.address);
        await this.gymToken.connect(accounts.holder).delegate(accounts.holder.address);

    })

    describe("Initialization: ", async () => {
        beforeEach("BeforeEach: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        })

        afterEach("AfterEach tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId]
            });
        })

        it("Should initialize with correct values: ", async () => {
            expect("\"" + (await this.gymToken.name()) + "\"").to.equal(variables.gymToken[0]);
            expect("\"" + (await this.gymToken.symbol()) + "\"").to.equal(variables.gymToken[1]);
            expect(await this.gymToken.decimals()).to.equal(variables.gymToken[2]);
            expect(await this.gymToken.totalSupply()).to.equal(variables.gymToken[3]);
        })
    })

    describe("Burn function: ", async () => {
        beforeEach("BeforeEach: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        })

        afterEach("AfterEach tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId]
            });
        })

        it("Should burn gym tokens: ", async () => {
            await this.gymToken.connect(accounts.holder).transfer(accounts.caller.address, variables.TEST_TX_AMOUNT)

            let callerBal = await this.gymToken.balanceOf(accounts.caller.address)
            let totalSupply = await this.gymToken.totalSupply()
            await this.gymToken.connect(accounts.caller).burn(variables.TEST_TX_AMOUNT)

            expect(await this.gymToken.balanceOf(accounts.caller.address)).to.equal(callerBal - variables.TEST_TX_AMOUNT)
            expect(await this.gymToken.totalSupply()).to.equal(BigNumber.from(totalSupply).sub(variables.TEST_TX_AMOUNT))
        })
    })

    describe("BurnFrom function: ", async () => {
        beforeEach("BeforeEach: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        })

        afterEach("AfterEach tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId]
            });
        })

        it("Should burn gym tokens: ", async () => {
            let holderBal = await this.gymToken.balanceOf(accounts.holder.address)
            let totalSupply = await this.gymToken.totalSupply()

            await this.gymToken.connect(accounts.holder).approve(accounts.caller.address, variables.TEST_TX_AMOUNT)
            await this.gymToken.burnFrom(accounts.holder.address, variables.TEST_TX_AMOUNT)

            expect(await this.gymToken.balanceOf(accounts.holder.address)).to.equal(BigNumber.from(holderBal).sub(variables.TEST_TX_AMOUNT))
            expect(await this.gymToken.totalSupply()).to.equal(BigNumber.from(totalSupply).sub(variables.TEST_TX_AMOUNT))
        })

        it("Should revert with 'GymToken: burn amount exceeds allowance': ", async () => {
            await this.gymToken.connect(accounts.holder).approve(accounts.caller.address, variables.TEST_TX_AMOUNT)

            await expect(this.gymToken.burnFrom(accounts.holder.address, variables.TEST_TX_AMOUNT * 2)).to.be.revertedWith("GymToken: burn amount exceeds allowance")
        })
    })
})