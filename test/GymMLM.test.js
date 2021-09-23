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
    getNamedSigners
} = ethers;
const {
    VARIABLES,
    getDeploymentArgs
} = require("../helpers/data/constants")

describe("GymMLM contract: ", function () {
    let accounts, deploymentArgs;
    const variables = VARIABLES.hardhat
    const depositAmount = 500;
    const transferAmount = 5000;
    const gymMLMReward = variables.gymVaultsBank[0];
    const gymMLMBonuses = variables.gymMLM[0];
    const gymMLMAmount = depositAmount * gymMLMReward / 100;

    before("Before All: ", async () => {
        accounts = await getNamedSigners();
        await hre.run("deployMocks");

        const chainId = await getChainId()

        deploymentArgs = await getDeploymentArgs(chainId, "GymToken");

        await deployments.deploy("GymToken", {
            from: accounts.deployer.address,
            args: [deploymentArgs.holder],
            log: true,
            deterministicDeployment: false
        })
        this.gymToken = await getContract("GymToken", accounts.caller);

        deploymentArgs = await getDeploymentArgs(chainId, "GymVaultsBank");
        await deployments.deploy("GymVaultsBank", {
            from: accounts.deployer.address,
            contract: "GymVaultsBank",
            args: [deploymentArgs.startBlock, deploymentArgs.gymTokenAddress, deploymentArgs.rewardRate],
            log: true,
            deterministicDeployment: false
        })
        this.gymVaultsBank = await getContract("GymVaultsBank", accounts.caller)

        await deployments.deploy("BuyBack", {
            from: accounts.deployer.address,
            contract: "BuyBack",
            args: [],
            log: true,
            deterministicDeployment: false
        })
        this.buyBack = await getContract("BuyBack", accounts.caller)

        await deployments.deploy("GymMLM", {
            from: accounts.deployer.address,
            contract: "GymMLM",
            args: [],
            log: true,
            deterministicDeployment: false
        })
        this.gymMLM = await getContract("GymMLM", accounts.deployer);
        await this.gymMLM.setBankAddress(this.gymVaultsBank.address)
        this.wantToken = await getContract("WantToken2", accounts.caller);
        this.WBNBMock = await getContract("WBNBMock", accounts.caller);
        this.strategy = await getContract("StrategyMock2", accounts.caller);
        this.strategyAlpaca = await getContract("StrategyMock", accounts.caller);
        this.routerMock = await getContract("RouterMock", accounts.caller);

        await this.gymToken.connect(accounts.holder).delegate(this.buyBack.address)
        await this.gymVaultsBank.connect(accounts.deployer).setTreasuryAddress(accounts.deployer.address)

        for (const signer in accounts) {
            if (signer == "deployer") {
                continue
            }

            await this.wantToken.connect(accounts.deployer).transfer(accounts[signer].address, transferAmount)
        }

        await this.wantToken.connect(accounts.deployer).transfer(this.routerMock.address, transferAmount)
        await this.wantToken.connect(accounts.deployer).transfer(accounts.grno.address, transferAmount)

        await this.gymToken.connect(accounts.holder).transfer(this.gymVaultsBank.address, 100000)
        await this.gymToken.connect(accounts.holder).transfer(this.routerMock.address, 100000)

        await this.gymVaultsBank.connect(accounts.deployer).add(this.WBNBMock.address, 20, false, this.strategyAlpaca.address)
        await this.gymVaultsBank.connect(accounts.deployer).add(this.wantToken.address, 20, true, this.strategy.address)
    })

    describe("Initialization: ", async () => {
        it("Should initialize with correct values: ", async () => {
            expect(await this.gymMLM.bankAddress()).to.equal(this.gymVaultsBank.address);
            expect(await this.gymMLM.addressToId(accounts.deployer.address)).to.equal(1);
            expect(await this.gymMLM.idToAddress(1)).to.equal(accounts.deployer.address);
            expect(await this.gymMLM.userToReferrer(await this.gymMLM.idToAddress(1))).to.equal(accounts.deployer.address);
            expect(await this.gymMLM.currentId()).to.equal(2);
            for (let i = 0; i < variables.gymMLM[1]; i++) {
                expect(await this.gymMLM.directReferralBonuses(i)).to.equal(variables.gymMLM[0][i]);

            }
        })
    })

    describe("AddGymMLM function: ", async () => {
        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        })

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId]
            });
        })


        it("Should add new gymMLM: ", async () => {
            let currentId = await this.gymMLM.currentId();
            let referrerId = await this.gymMLM.addressToId(accounts.deployer.address)

            expect(await this.gymMLM.userToReferrer(await this.gymMLM.idToAddress(currentId))).to.equal(await this.gymMLM.idToAddress(0))

            await this.wantToken.connect(accounts.vzgo).approve(this.gymVaultsBank.address, depositAmount)

            await this.gymVaultsBank.connect(accounts.vzgo).deposit(1, depositAmount, referrerId, 0, new Date().getTime() + 20)
            expect(await this.gymMLM.userToReferrer(await this.gymMLM.idToAddress(currentId))).to.equal(await this.gymMLM.idToAddress(referrerId))
        })

        it("Should revert with 'GymMLM::referrer is zero address': ", async () => {
            await this.wantToken.connect(accounts.vzgo).approve(this.gymVaultsBank.address, depositAmount)
            await expect(this.gymVaultsBank.connect(accounts.vzgo).deposit(1, depositAmount, 4, 0, new Date().getTime() + 20))
                .to.be.revertedWith("GymMLM::referrer is zero address")
        })
    })

    describe("DistributeRewards function for tokens: ", async () => {
        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        })

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId]
            });
        })

        it("Should distribute rewards for referrers: ", async () => {
            let prevSigner = "deployer";
            let index = 0,
                prevSignerBal;
            let ownerBal = (await this.wantToken.balanceOf(accounts.owner.address)).sub(depositAmount);

            for (const signer in accounts) {
                if (signer == "deployer") {
                    continue
                }

                await this.wantToken.connect(accounts[signer]).approve(this.gymVaultsBank.address, depositAmount)
                await this.gymVaultsBank.connect(accounts[signer]).deposit(1, depositAmount, this.gymMLM.addressToId(accounts[prevSigner].address), 0, new Date().getTime() + 20)

                if (index == 0) {
                    prevSigner = signer;
                    prevSignerBal = await this.wantToken.balanceOf(accounts[signer].address)
                    index++;
                    continue
                }

                if (index == 16) {
                    expect((await this.wantToken.balanceOf(accounts.owner.address)).sub(ownerBal)).to.equal(0)
                } else {
                    expect((await this.wantToken.balanceOf(accounts.owner.address)).sub(ownerBal))
                        .to.equal(Math.floor(depositAmount * gymMLMBonuses[index - 1] / 100))
                }
                expect((await this.wantToken.balanceOf(accounts[prevSigner].address)).sub(prevSignerBal))
                    .to.equal(Math.floor(depositAmount * gymMLMBonuses[0] / 100))

                ownerBal = await this.wantToken.balanceOf(accounts.owner.address)
                prevSigner = signer;
                prevSignerBal = await this.wantToken.balanceOf(accounts[prevSigner].address)
                index++;
            }
        })

        it("Should transfer unmute tokens to treasure address: ", async () => {
            let deployerAmtBefore = await this.wantToken.balanceOf(accounts.deployer.address)
            await this.wantToken.connect(accounts.vzgo).approve(this.gymVaultsBank.address, depositAmount)
            await this.gymVaultsBank.connect(accounts.vzgo).deposit(1, depositAmount, await this.gymMLM.addressToId(accounts.deployer.address), 0, new Date().getTime() + 20)

            expect((await this.wantToken.balanceOf(accounts.deployer.address)).sub(deployerAmtBefore)).to.equal(gymMLMAmount)
            deployerAmtBefore = await this.wantToken.balanceOf(accounts.deployer.address)

            await this.wantToken.connect(accounts.grno).approve(this.gymVaultsBank.address, depositAmount)
            await this.gymVaultsBank.connect(accounts.grno).deposit(1, depositAmount, await this.gymMLM.addressToId(accounts.vzgo.address), 0, new Date().getTime() + 20)

            expect((await this.wantToken.balanceOf(accounts.deployer.address)).sub(deployerAmtBefore))
                .to.equal(gymMLMAmount - depositAmount * gymMLMBonuses[0] / 100)
        })
    })

    describe("DistributeRewards function for BNB: ", async () => {
        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        })

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId]
            });
        })

        it("Should distribute rewards for referrers: ", async () => {
            let prevSigner = "deployer";
            let index = 0,
                prevSignerBal;
            let ownerBal = (await accounts.owner.getBalance()).sub(depositAmount);
            let gymMLMAmount = depositAmount * gymMLMReward / 100;
            let tx;

            for (const signer in accounts) {
                if (signer == "deployer") {
                    continue
                }

                tx = await this.gymVaultsBank.connect(accounts[signer]).deposit(0, 0, await this.gymMLM.addressToId(accounts[prevSigner].address), 0, new Date().getTime() + 20, {
                    value: depositAmount
                })

                if (index == 0) {
                    prevSigner = signer;
                    prevSignerBal = await accounts[signer].getBalance()
                    ownerBal = ownerBal.sub((await tx.wait()).gasUsed * tx.gasPrice)
                    index++;
                    continue
                }

                if (index == 16) {
                    expect((await accounts.owner.getBalance()).sub(ownerBal)).to.equal(0)
                } else {
                    expect((await accounts.owner.getBalance()).sub(ownerBal))
                        .to.equal(Math.floor(depositAmount * gymMLMBonuses[index - 1] / 100))
                }
                expect((await accounts[prevSigner].getBalance()).sub(prevSignerBal))
                    .to.equal(Math.floor(depositAmount * gymMLMBonuses[0] / 100))

                ownerBal = await accounts.owner.getBalance()
                prevSigner = signer;
                prevSignerBal = await accounts[prevSigner].getBalance()
                index++;
            }
        })

        it("Should transfer unmute BNB to treasure address: ", async () => {
            let deployerAmtBefore = await accounts.deployer.getBalance()
            await this.gymVaultsBank.connect(accounts.vzgo).deposit(0, 0, await this.gymMLM.addressToId(accounts.deployer.address), 0, new Date().getTime() + 20, {
                value: depositAmount
            })

            expect((await accounts.deployer.getBalance()).sub(deployerAmtBefore)).to.equal(gymMLMAmount)
            deployerAmtBefore = await accounts.deployer.getBalance()

            await this.gymVaultsBank.connect(accounts.grno).deposit(0, 0, await this.gymMLM.addressToId(accounts.vzgo.address), 0, new Date().getTime() + 20, {
                value: depositAmount
            })

            expect((await accounts.deployer.getBalance()).sub(deployerAmtBefore))
                .to.equal(gymMLMAmount - depositAmount * gymMLMBonuses[0] / 100)
        })
    })
})