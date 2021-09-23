const { expect } = require("chai");
const { deployments, network, ethers } = require("hardhat");

const { advanceBlockTo } = require("./utilities/time");
const { VARIABLES, getDeploymentArgs } = require("../utils");

let accounts;
const variables = VARIABLES.hardhat;

describe("GymVaultsBank contract: ", function () {
    before("Before All: ", async () => {
        // await deployments.fixture()
        let deploymentArgs;
        const chainId = await getChainId();
        accounts = await ethers.getNamedSigners();
        await hre.run("deployMocks");
        deploymentArgs = await getDeploymentArgs(chainId, "GymToken");

        await deployments.deploy("GymToken", {
            from: accounts.deployer.address,
            args: [deploymentArgs.holder],
            log: true,
            deterministicDeployment: false,
        });

        relDeploymentArgs = await getDeploymentArgs(chainId, "GymMLM");

        await deployments.deploy("GymMLM", {
            from: accounts.deployer.address,
            args: [],
            log: true,
            deterministicDeployment: false,
        });

        await deployments.deploy("BuyBack", {
            from: accounts.deployer.address,
            args: [],
            log: true,
            deterministicDeployment: false,
        });

        this.deploymentArgs = await getDeploymentArgs(chainId, "GymVaultsBank");

        await deployments.deploy("GymVaultsBank", {
            from: accounts.deployer.address,
            contract: "GymVaultsBank",
            args: [this.deploymentArgs.startBlock, this.deploymentArgs.gymTokenAddress, this.deploymentArgs.rewardRate],
            log: true,
            deterministicDeployment: false,
        });

        farmingDeploymentArgs = await getDeploymentArgs(chainId, "GymFarming");
        await deployments.deploy("GymFarming", {
            from: accounts.deployer.address,
            args: [
                farmingDeploymentArgs.bank,
                farmingDeploymentArgs.rewardToken,
                farmingDeploymentArgs.rewardPerBlock,
                farmingDeploymentArgs.startBlock,
            ],
            log: true,
            deterministicDeployment: false,
        });
        this.wantToken1 = await ethers.getContract("WantToken1", accounts.caller);
        this.wantToken2 = await ethers.getContract("WantToken2", accounts.caller);
        this.gymToken = await ethers.getContract("GymToken", accounts.caller);
        this.relationship = await ethers.getContract("GymMLM", accounts.caller);
        this.farming = await ethers.getContract("GymFarming", accounts.deployer);
        await this.farming.connect(accounts.deployer).add(30, farmingDeploymentArgs.rewardToken, false);
        this.buyBack = await ethers.getContract("BuyBack", accounts.caller);
        this.gymVaultsBank = await ethers.getContract("GymVaultsBank", accounts.deployer);
        this.WBNB = await ethers.getContract("WBNBMock", accounts.caller);
        this.earnToken = await ethers.getContract("EarnToken", accounts.caller);
        this.strategy1 = await ethers.getContract("StrategyMock1", accounts.deployer);
        this.strategy2 = await ethers.getContract("StrategyMock2", accounts.deployer);
        this.strategy = await ethers.getContract("StrategyMock", accounts.caller);
        this.routerMock = await ethers.getContract("RouterMock", accounts.caller);

        await this.gymVaultsBank.connect(accounts.deployer).setFarmingAddress(this.farming.address);
        await this.gymVaultsBank.connect(accounts.deployer).setTreasuryAddress(accounts.owner.address);
        await this.gymVaultsBank.connect(accounts.deployer).setWithdrawFee(1000);
        await this.WBNB.connect(accounts.deployer).deposit({
            value: ethers.utils.parseEther("10"),
        });
        await this.gymToken
            .connect(accounts.holder)
            .transfer(this.gymVaultsBank.address, ethers.utils.parseEther("10000"));
        await this.gymToken.connect(accounts.holder).delegate(this.buyBack.address);
        await this.WBNB.connect(accounts.deployer).transfer(this.routerMock.address, ethers.utils.parseEther("10"));
        await accounts.deployer.sendTransaction({
            value: ethers.utils.parseEther("5000"),
            to: this.routerMock.address,
        });
        await this.gymToken.connect(accounts.holder).approve(this.routerMock.address, ethers.utils.parseEther("1000"));
        await this.gymVaultsBank.connect(accounts.deployer).add(this.WBNB.address, 30, false, this.strategy.address);

        this.strategy3 = await ethers.getContract("StrategyMock3", accounts.deployer);

        await this.wantToken2
            .connect(accounts.deployer)
            .transfer(accounts.vzgo.address, variables.TEST_WANTTOKEN2_AMOUNT / 4);
        await this.wantToken2
            .connect(accounts.deployer)
            .transfer(accounts.grno.address, variables.TEST_WANTTOKEN2_AMOUNT / 4);
        await this.wantToken2
            .connect(accounts.deployer)
            .transfer(this.routerMock.address, variables.TEST_WANTTOKEN2_AMOUNT / 4);

        await this.wantToken1
            .connect(accounts.deployer)
            .transfer(accounts.grno.address, variables.TEST_WANTTOKEN1_AMOUNT / 2);
        await this.wantToken1
            .connect(accounts.deployer)
            .transfer(accounts.vzgo.address, variables.TEST_WANTTOKEN1_AMOUNT / 2);
        await this.gymToken
            .connect(accounts.holder)
            .transfer(this.gymVaultsBank.address, variables.TEST_GYMTOKEN_BANKS_BALANCE);
        await this.gymToken
            .connect(accounts.holder)
            .transfer(this.routerMock.address, ethers.utils.parseEther(variables.TEST_AMOUNT.toString()));
        await this.earnToken
            .connect(accounts.deployer)
            .transfer(this.gymVaultsBank.address, variables.TEST_REWARDTOKEN_BANKS_BALANCE);
    });
    describe("Initialization: ", async () => {
        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });

        it("Should initialize with correct parameters:", async () => {
            expect(await this.gymVaultsBank.RELATIONSHIP_REWARD()).to.equal(variables.gymVaultsBank[0]);
            expect(await this.gymVaultsBank.VAULTS_SAVING()).to.equal(variables.gymVaultsBank[1]);
            expect(await this.gymVaultsBank.BUY_AND_BURN_GYM()).to.equal(variables.gymVaultsBank[2]);
            expect(await this.gymVaultsBank.startBlock()).to.equal(this.deploymentArgs.startBlock);
            expect(await this.gymVaultsBank.rewardPoolInfo()).to.deep.equal([
                this.deploymentArgs.gymTokenAddress,
                ethers.BigNumber.from(this.deploymentArgs.rewardRate),
            ]);
        });

        it("Should revert:GymVaultsBank: Start block must have a bigger value", async () => {
            const startBlock = await ethers.provider.getBlockNumber();
            await advanceBlockTo(startBlock + 10);

            await expect(
                deployments.deploy("GymVaultsBank", {
                    from: accounts.deployer.address,
                    args: [startBlock, this.deploymentArgs.gymTokenAddress, this.deploymentArgs.rewardRate],
                    log: true,
                    deterministicDeployment: false,
                })
            ).to.be.revertedWith("GymVaultsBank: Start block must have a bigger value");
        });
    });

    describe("Reward Pool functions: ", async () => {
        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });

        it("Should update RewardPerBlock", async () => {
            let rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
            await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 15);

            expect((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock).to.equal(rewardPerBlock);

            await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 20);

            await this.gymVaultsBank.connect(accounts.deployer).updateRewardPerBlock();

            expect(
                Math.floor(ethers.BigNumber.from((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock))
            ).to.equal(Math.floor((rewardPerBlock * variables.gymVaultsBank[7]) / 1e12));

            await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 41);

            await this.gymVaultsBank.connect(accounts.deployer).updateRewardPerBlock();

            expect(
                Math.floor(ethers.BigNumber.from((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock))
            ).to.equal(Math.floor((rewardPerBlock * variables.gymVaultsBank[7] ** 2) / 1e12 ** 2));

            await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 62);

            await this.gymVaultsBank.connect(accounts.deployer).updateRewardPerBlock();

            expect(
                Math.floor(ethers.BigNumber.from((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock))
            ).to.equal(Math.floor((rewardPerBlock * variables.gymVaultsBank[7] ** 3) / 1e12 ** 3));

            await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 90);

            await this.gymVaultsBank.connect(accounts.deployer).updateRewardPerBlock();

            expect(
                Math.floor(ethers.BigNumber.from((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock))
            ).to.equal(Math.floor((rewardPerBlock * variables.gymVaultsBank[7] ** 3) / 1e12 ** 3));
        });

        it("Should revert with message: Ownable: caller is not the owner", async () => {
            await expect(this.gymVaultsBank.connect(accounts.caller).updateRewardPerBlock()).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });
    });

    describe("Add function: ", async () => {
        const allocPoint = 20;
        const corePoolAllocPoint = 30;
        let poolLength;

        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });
        it("Should add Pool:", async () => {
            poolLength = await this.gymVaultsBank.poolLength();
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + 150);

            tx = await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy1.address);
            poolLength = poolLength.add(1);

            expect(await this.gymVaultsBank.poolLength()).to.equal(poolLength);
            expect(await this.gymVaultsBank.poolInfo(poolLength.sub(1))).to.deep.equal([
                this.wantToken2.address,
                ethers.BigNumber.from(20),
                ethers.BigNumber.from(tx.blockNumber),
                ethers.BigNumber.from(0),
                this.strategy1.address,
            ]);
            expect(await this.gymVaultsBank.totalAllocPoint()).to.equal(allocPoint + corePoolAllocPoint);
        });

        it("Should set new allocation point:", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + 150);

            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy1.address);
            const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();
            const poolAllocPoint = (await this.gymVaultsBank.poolInfo(poolLength.sub(1))).allocPoint;
            const newAllocPoint = ethers.BigNumber.from(30);

            await this.gymVaultsBank.connect(accounts.deployer).set(poolLength.sub(1), newAllocPoint);
            expect(await this.gymVaultsBank.totalAllocPoint()).to.equal(
                totalAllocPoint.sub(poolAllocPoint).add(newAllocPoint)
            );
            expect((await this.gymVaultsBank.poolInfo(poolLength.sub(1))).allocPoint).to.equal(newAllocPoint);
        });

        it("Should: Reset Strategy", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + 150);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy1.address);

            await this.gymVaultsBank.connect(accounts.deployer).resetStrategy(1, this.strategy2.address);
            expect((await this.gymVaultsBank.poolInfo(1)).strategy).to.equal(this.strategy2.address);

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );
            await this.gymVaultsBank
                .connect(accounts.grno)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            await expect(
                this.gymVaultsBank.connect(accounts.deployer).resetStrategy(1, this.strategy3.address)
            ).to.be.revertedWith("GymVaultsBank: Strategy not empty");
        });
    });

    describe("Deposit, Pending", async () => {
        before(async () => {
            this.vzgoWant2Balance = await this.wantToken2.balanceOf(accounts.vzgo.address);
            this.grnoWant2Balance = await this.wantToken2.balanceOf(accounts.grno.address);
            this.grnoWant1Balance = await this.wantToken1.balanceOf(accounts.grno.address);
            this.rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
        });

        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });
        const allocPoint = 30;
        it("Should add deposit from vzgo, return correct stakedWantTokens count:", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);
            poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;

            const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            tx = await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            expect(await this.wantToken2.balanceOf(accounts.vzgo.address)).to.equal(
                this.vzgoWant2Balance.sub(variables.TEST_AMOUNT)
            );
            // const depositTime = (await ethers.provider.getBlock(tx.blockNumber)).timestamp;
            // expect((await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares).to.equal(variables.TEST_AMOUNT * variables.gymVaultsBank[1] / 100)

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + variables.TEST_BLOCK_COUNT);

            expect(await this.gymVaultsBank.stakedWantTokens(1, accounts.vzgo.address)).to.equal(
                (variables.TEST_AMOUNT * variables.gymVaultsBank[1]) / 100
            );
            expect(
                ethers.BigNumber.from(await this.gymVaultsBank.pendingReward(1, accounts.vzgo.address)).add(1)
            ).to.equal(this.rewardPerBlock.mul(variables.TEST_BLOCK_COUNT).mul(poolAllocPoint1).div(totalAllocPoint));
        });

        it("Should calculate rewards for 2 users in 1 pool:", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);
            poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;

            const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);

            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );
            await this.gymVaultsBank
                .connect(accounts.grno)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            expect(await this.wantToken2.balanceOf(accounts.vzgo.address)).to.equal(
                this.vzgoWant2Balance - variables.TEST_AMOUNT
            );
            expect(await this.wantToken2.balanceOf(accounts.grno.address)).to.equal(
                this.grnoWant2Balance - variables.TEST_AMOUNT
            );

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + variables.TEST_BLOCK_COUNT);

            expect(
                ethers.BigNumber.from(await this.gymVaultsBank.pendingReward(1, accounts.vzgo.address)).add(1)
            ).to.equal(
                this.rewardPerBlock
                    .mul(variables.TEST_BLOCK_COUNT)
                    .mul(poolAllocPoint1)
                    .div(totalAllocPoint)
                    .add(this.rewardPerBlock)
                    .mul(poolAllocPoint1)
                    .div(totalAllocPoint)
            );
            expect(await this.gymVaultsBank.pendingReward(1, accounts.grno.address)).to.equal(
                this.rewardPerBlock.div(2).mul(variables.TEST_BLOCK_COUNT).mul(poolAllocPoint1).div(totalAllocPoint)
            );
        });

        it("Should calculate rewards for 2 users in 2 different pools:", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);
            poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;

            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken1.address, 40, false, this.strategy1.address);

            const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();
            const poolAllocPoint2 = (await this.gymVaultsBank.poolInfo(2)).allocPoint;

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.wantToken1.connect(accounts.grno).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);

            const vzgoDeposit = await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );
            await this.gymVaultsBank
                .connect(accounts.grno)
                .deposit(
                    2,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            expect(await this.wantToken2.balanceOf(accounts.vzgo.address)).to.equal(
                this.vzgoWant2Balance - variables.TEST_AMOUNT
            );
            expect(await this.wantToken1.balanceOf(accounts.grno.address)).to.equal(
                this.grnoWant1Balance - variables.TEST_AMOUNT
            );

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + variables.TEST_BLOCK_COUNT);
            let currentBlock = await ethers.provider.getBlockNumber();
            // expect(await this.gymVaultsBank.pendingReward(1, accounts.vzgo.address))
            //     .to.equal((ethers.BigNumber.from(currentBlock).sub(vzgoDeposit.blockNumber)).mul(this.rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint))
            expect((await this.gymVaultsBank.pendingReward(2, accounts.grno.address)).add(1)).to.equal(
                this.rewardPerBlock.mul(variables.TEST_BLOCK_COUNT).mul(poolAllocPoint2).div(totalAllocPoint)
            );
        });
    });

    describe("depositBNB", async () => {
        before("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        after("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });
        it("Should deposit BNB", async () => {
            let vzgoBalance = await accounts.vzgo.getBalance();
            const allocPoint = 30;
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);
            poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;

            tx = await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    0,
                    0,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20,
                    {
                        value: ethers.utils.parseEther(variables.TEST_AMOUNT.toString()),
                    }
                );

            const fee = (await tx.wait()).gasUsed * tx.gasPrice;
            let finalBalance = vzgoBalance - ethers.utils.parseEther(variables.TEST_AMOUNT.toString()) - fee;
            expect(Number(await accounts.vzgo.getBalance())).to.be.closeTo(
                Number(finalBalance),
                Number(ethers.utils.parseEther("0.00000005"))
            );
            expect(Number((await this.gymVaultsBank.userInfo(0, accounts.vzgo.address)).shares)).to.equal(
                (variables.gymVaultsBank[1] / 100) * Number(ethers.utils.parseEther(variables.TEST_AMOUNT.toString()))
            );
        });
    });

    xdescribe("Claim and deposit in farming:", async () => {
        // fork
        before("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        after("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });

        it("Should deposit in gymVaultsbank, claim rewards and deposit in Farming", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, 30, false, this.strategy2.address);
            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + 150);
            await this.gymVaultsBank.connect(accounts.vzgo).claimAndDeposit(1, 0, 0, 0, new Date().getTime() + 20);
            expect((await this.farming.userInfo(0, accounts.vzgo.address)).amount).to.equal(
                variables.ROUTER_MOCK_RETURN_AMOUNT
            );
        });
    });

    describe("Claim function: ", async () => {
        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });

        it("Should claim rewards", async () => {
            let rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, 30, false, this.strategy2.address);
            let poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;
            let totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();
            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + 150);

            let pending = await this.gymVaultsBank.connect(accounts.vzgo).pendingReward(1, accounts.vzgo.address);

            await this.gymVaultsBank.connect(accounts.vzgo).claim(1);

            expect(await this.gymToken.balanceOf(accounts.vzgo.address)).to.equal(
                pending.add(rewardPerBlock.mul(poolAllocPoint1).div(totalAllocPoint))
            );
        });

        it("Should claimAll rewards", async () => {
            let rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, 30, false, this.strategy2.address);

            let poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;
            let totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );
            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    0,
                    0,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20,
                    {
                        value: ethers.utils.parseEther(variables.TEST_AMOUNT.toString()),
                    }
                );

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + 150);

            let pending0 = await this.gymVaultsBank.connect(accounts.vzgo).pendingReward(0, accounts.vzgo.address);
            let pending1 = await this.gymVaultsBank.connect(accounts.vzgo).pendingReward(1, accounts.vzgo.address);

            await this.gymVaultsBank.connect(accounts.vzgo).claimAll();

            expect(Math.floor(await this.gymToken.balanceOf(accounts.vzgo.address))).to.equal(
                Math.floor(pending0.add(pending1).add(rewardPerBlock))
            );
        });
    });

    describe("Withdraw", async () => {
        before(async () => {
            this.vzgoWant2Balance = await this.wantToken2.balanceOf(accounts.vzgo.address);
            this.grnoWant2Balance = await this.wantToken2.balanceOf(accounts.grno.address);
            this.grnoWant1Balance = await this.wantToken1.balanceOf(accounts.grno.address);
            this.rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
        });
        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });
        const allocPoint = 30;
        it("Should transfer all assets to Vzgo(single user):", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);
            poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;
            totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);

            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            let vzgoShares = (await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares;

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + variables.TEST_BLOCK_COUNT);

            const pendingReward = await this.gymVaultsBank.pendingReward(1, accounts.vzgo.address);

            await this.gymVaultsBank.connect(accounts.vzgo).withdraw(1, vzgoShares);
            expect((await this.wantToken2.balanceOf(accounts.vzgo.address)).sub(1)).to.equal(
                Math.floor(
                    this.vzgoWant2Balance -
                        (variables.TEST_AMOUNT * (variables.gymVaultsBank[2] + variables.gymVaultsBank[0])) / 100 -
                        vzgoShares / 10
                )
            );
            expect(ethers.BigNumber.from(await this.gymToken.balanceOf(accounts.vzgo.address))).to.equal(
                ethers.BigNumber.from(this.rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
            );
        });
        it("Should transfer part of  assets to Vzgo(single user):", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);
            poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;
            totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);

            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            let vzgoShares = (await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares;

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + variables.TEST_BLOCK_COUNT);

            const pendingReward = await this.gymVaultsBank.pendingReward(1, accounts.vzgo.address);

            await this.gymVaultsBank.connect(accounts.vzgo).withdraw(1, vzgoShares - 20);

            expect((await this.wantToken2.balanceOf(accounts.vzgo.address)).sub(1)).to.equal(
                Math.floor(
                    this.vzgoWant2Balance -
                        20 -
                        (variables.TEST_AMOUNT * (variables.gymVaultsBank[2] + variables.gymVaultsBank[0])) / 100 -
                        (vzgoShares - 20) / 10
                )
            );
            expect(ethers.BigNumber.from(await this.gymToken.balanceOf(accounts.vzgo.address))).to.equal(
                ethers.BigNumber.from(this.rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
            );
        });
        it("Should withdraw all assets (2 users in 1 pool):", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);
            poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;

            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken1.address, 40, false, this.strategy1.address);
            const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);

            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );
            await this.gymVaultsBank
                .connect(accounts.grno)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            let vzgoShares = (await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares;
            let grnoShares = (await this.gymVaultsBank.userInfo(1, accounts.grno.address)).shares;

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + variables.TEST_BLOCK_COUNT);

            let pendingReward = await this.gymVaultsBank.pendingReward(1, accounts.vzgo.address);
            await this.gymVaultsBank.connect(accounts.vzgo).withdraw(1, variables.TEST_AMOUNT);

            expect((await this.wantToken2.balanceOf(accounts.vzgo.address)).sub(1)).to.equal(
                Math.floor(
                    this.vzgoWant2Balance -
                        (variables.TEST_AMOUNT * (variables.gymVaultsBank[2] + variables.gymVaultsBank[0])) / 100 -
                        vzgoShares / 10
                )
            );
            expect(ethers.BigNumber.from(await this.gymToken.balanceOf(accounts.vzgo.address))).to.equal(
                ethers.BigNumber.from(
                    this.rewardPerBlock.div(2).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
                )
            );

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + variables.TEST_BLOCK_COUNT);

            pendingReward = await this.gymVaultsBank.pendingReward(1, accounts.grno.address);

            await this.gymVaultsBank.connect(accounts.grno).withdraw(1, variables.TEST_AMOUNT);

            expect((await this.wantToken2.balanceOf(accounts.grno.address)).sub(1)).to.equal(
                Math.floor(
                    this.grnoWant2Balance -
                        (variables.TEST_AMOUNT * (variables.gymVaultsBank[2] + variables.gymVaultsBank[0])) / 100 -
                        grnoShares / 10
                )
            );
            expect(ethers.BigNumber.from(await this.gymToken.balanceOf(accounts.grno.address))).to.equal(
                ethers.BigNumber.from(this.rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
            );
        });
        it("Should transfer all assets(more than balance) safeTransfer check:", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);
            poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;

            const bankGymBalance = await this.gymToken.balanceOf(this.gymVaultsBank.address);

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);

            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            let vzgoShares = (await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares;

            await advanceBlockTo(
                (await ethers.provider.getBlockNumber()) + variables.TEST_BLOCK_COUNT_FOR_SAFETRANSFER
            );

            await this.gymVaultsBank.connect(accounts.vzgo).withdraw(1, variables.TEST_AMOUNT);

            expect(await this.wantToken2.balanceOf(accounts.vzgo.address)).to.equal(
                this.vzgoWant2Balance
                    .sub((variables.TEST_AMOUNT * (variables.gymVaultsBank[2] + variables.gymVaultsBank[0])) / 100)
                    .sub(vzgoShares.div(10))
            );
            expect(await this.gymToken.balanceOf(accounts.vzgo.address)).to.equal(bankGymBalance);
        });
    });

    describe("WithdrawBNB", async () => {
        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });
        it("Should withdraw all shared amount and return BNB", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            let poolAllocPoint = (await this.gymVaultsBank.poolInfo(0)).allocPoint;
            let totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();
            let rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;

            const vzgoBalance = (await accounts.vzgo.getBalance()).toString();

            let depositTx = await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    0,
                    0,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20,
                    {
                        value: ethers.utils.parseEther(variables.TEST_AMOUNT.toString()),
                    }
                );
            let vzgoShares = (await this.gymVaultsBank.userInfo(0, accounts.vzgo.address)).shares;

            await advanceBlockTo((await ethers.provider.getBlockNumber()) + variables.TEST_BLOCK_COUNT);

            const pendingReward = await this.gymVaultsBank.pendingReward(0, accounts.vzgo.address);

            let withdrawTx = await this.gymVaultsBank
                .connect(accounts.vzgo)
                .withdraw(0, ethers.utils.parseEther(variables.TEST_AMOUNT.toString()));

            let fee =
                (await depositTx.wait()).gasUsed * depositTx.gasPrice +
                (await withdrawTx.wait()).gasUsed * withdrawTx.gasPrice;

            expect(ethers.BigNumber.from(await accounts.vzgo.getBalance())).to.be.closeTo(
                ethers.BigNumber.from(vzgoBalance)
                    .sub(
                        ethers.BigNumber.from(ethers.utils.parseEther(variables.TEST_AMOUNT.toString()))
                            .mul(ethers.BigNumber.from(variables.gymVaultsBank[2]).add(variables.gymVaultsBank[0]))
                            .div(100)
                    )
                    .sub(vzgoShares.div(10)),
                ethers.BigNumber.from(fee)
            );
            expect(await this.gymToken.balanceOf(accounts.vzgo.address)).to.be.closeTo(
                pendingReward.add(rewardPerBlock).mul(poolAllocPoint).div(totalAllocPoint),
                ethers.BigNumber.from(40)
            );
        });
    });

    describe("MigrateStrategy", async () => {
        beforeEach("Before: ", async () => {
            snapshotId = await network.provider.request({
                method: "evm_snapshot",
                params: [],
            });
        });

        afterEach("After tests: ", async () => {
            await network.provider.request({
                method: "evm_revert",
                params: [snapshotId],
            });
        });
        const allocPoint = 30;
        it("Should migrate strategy:", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);

            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );
            await this.gymVaultsBank
                .connect(accounts.grno)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );

            const oldStrategyWantLocked = await this.strategy2.wantLockedTotal();
            const oldStrategySharesTotal = await this.strategy2.sharesTotal();

            await this.gymVaultsBank.connect(accounts.deployer).migrateStrategy(1, this.strategy3.address);

            expect(await this.strategy3.wantLockedTotal()).to.equal(oldStrategyWantLocked);
            expect(await this.strategy3.sharesTotal()).to.equal(oldStrategySharesTotal);
            expect(await this.strategy2.wantLockedTotal()).to.equal(0);
            expect(await this.strategy2.sharesTotal()).to.equal(0);
        });

        it("Should revert with message: GymVaultsBank: New strategy not empty", async () => {
            await advanceBlockTo((await ethers.provider.getBlockNumber()) + this.deploymentArgs.startBlock);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, allocPoint, false, this.strategy2.address);
            await this.gymVaultsBank
                .connect(accounts.deployer)
                .add(this.wantToken2.address, 40, false, this.strategy3.address);
            await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, variables.TEST_AMOUNT);
            await this.gymVaultsBank
                .connect(accounts.vzgo)
                .deposit(
                    1,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );
            await this.gymVaultsBank
                .connect(accounts.grno)
                .deposit(
                    2,
                    variables.TEST_AMOUNT,
                    await this.relationship.addressToId(accounts.deployer.address),
                    0,
                    new Date().getTime() + 20
                );
            await expect(
                this.gymVaultsBank.connect(accounts.deployer).migrateStrategy(1, this.strategy3.address)
            ).to.be.revertedWith("GymVaultsBank: New strategy not empty");
        });
    });
});
