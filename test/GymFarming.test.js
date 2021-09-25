const { expect, assert } = require("chai");
const { advanceBlock, advanceBlockTo, prepare, deploy, getBigNumber } = require("./utilities");
const { deployments, network, ethers } = require("hardhat");
const { getNamedSigners } = ethers;
const { VARIABLES, getDeploymentArgs } = require("../helpers/data/constants");

let accounts;
const variables = VARIABLES.hardhat;
const amount = getBigNumber(4);
const poolAllocPoint1 = 30;
const poolAllocPoint2 = 50;

describe("GymFarming contract: ", function () {
	before("Before All: ", async function() {
		accounts = await getNamedSigners();
		await hre.run("deployMocks");
		await prepare(this, ["ERC20Mock"]);

		const chainId = await getChainId();

		deploymentArgs = await getDeploymentArgs(chainId, "GymToken");

		await deployments.deploy("GymToken", {
			from: accounts.deployer.address,
			args: [deploymentArgs.holder],
			log: true,
			deterministicDeployment: false
		});

		deploymentArgs = await getDeploymentArgs(chainId, "GymVaultsBank");

		await deployments.deploy("GymVaultsBank", {
			from: accounts.deployer.address,
			contract: "GymVaultsBank",
			args: [deploymentArgs.startBlock, deploymentArgs.gymTokenAddress, deploymentArgs.rewardRate],
			log: true,
			deterministicDeployment: false
		});

		deploymentArgs = await getDeploymentArgs(chainId, "GymFarming");

		await deployments.deploy("GymFarming", {
			from: accounts.deployer.address,
			args: [
				deploymentArgs.bank,
				deploymentArgs.rewardToken,
				deploymentArgs.rewardPerBlock,
				deploymentArgs.startBlock
			],
			log: true,
			deterministicDeployment: false
		});

		this.gymFarming = await ethers.getContract("GymFarming", accounts.deployer);
		this.gym = await ethers.getContract("GymToken", accounts.caller);
		this.provider = await ethers.getContractAt(
			"ILiquidityProvider",
			"0x2B1C93fFfF55E2620D6fb5DaD7D69A6a468C9731",
			accounts.caller
		);
		await this.gym.connect(accounts.holder).transfer(this.gymFarming.address, ethers.utils.parseEther("1000000"));

		this.tokenA = await ethers.getContract("TokenA", accounts.caller);
		this.tokenB = await ethers.getContract("TokenB", accounts.caller);

		await deploy(this, [
			["testLp", this.ERC20Mock, ["LP Token", "LPT", getBigNumber(amount.mul(5))]],
			["testLp1", this.ERC20Mock, ["LP Token1", "LPT", getBigNumber(amount.mul(5))]]
		]);

		await this.testLp.transfer(accounts.caller.address, getBigNumber(amount));
		await this.testLp.transfer(accounts.chugun.address, getBigNumber(amount));
		await this.testLp.transfer(accounts.vzgo.address, getBigNumber(amount));
		await this.testLp1.transfer(accounts.vzgo.address, getBigNumber(amount));
		await this.testLp1.transfer(accounts.grno.address, getBigNumber(amount));

		this.startBlock = parseInt(await this.gymFarming.startBlock());
	});

	describe("Initialization: ", function() {
		it("Should initialize with correct values: ", async function() {
			expect(await this.gymFarming.rewardToken()).to.equal(deploymentArgs.rewardToken);
			expect(await this.gymFarming.rewardPerBlock()).to.equal(deploymentArgs.rewardPerBlock);
			expect(await this.gymFarming.startBlock()).to.equal(deploymentArgs.startBlock);
		});
	});

	describe("PoolLength function: ", function() {
		before("Before: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("PoolLength should execute: ", async function() {
			await this.gymFarming.add(poolAllocPoint1, this.testLp.address, false);
			await this.gymFarming.add(poolAllocPoint2, this.testLp1.address, true);

			expect(await this.gymFarming.poolLength()).to.equal(2);
		});
	});

	describe("Set function: ", function() {
		beforeEach("Before: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should set new allocPoint for pid: ", async function() {
			await this.gymFarming.add(poolAllocPoint1, this.testLp.address, false);
			await this.gymFarming.add(poolAllocPoint2, this.testLp1.address, true);

			await this.gymFarming.set(0, poolAllocPoint2, true);
			await this.gymFarming.set(1, poolAllocPoint1, true);

			expect((await this.gymFarming.poolInfo(0)).allocPoint).to.equal(poolAllocPoint2);
			expect((await this.gymFarming.poolInfo(1)).allocPoint).to.equal(poolAllocPoint1);
		});

		it("Should revert if invalid pool", async function() {
			await expect(this.gymFarming.set(0, poolAllocPoint2, true)).to.be.revertedWith("Farming::UNKNOWN_POOL");
		});
	});

	describe("pendingReward function: ", function() {
		beforeEach("Before: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("PendingReward should equal ExpectedGym: ", async function() {
			await advanceBlockTo(await ethers.provider.getBlockNumber());
			const pid = await this.gymFarming.poolLength();
			const blockToAdvance = 35;
			expect(pid).to.equal(0);

			let approve = await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			approve = await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			approve = await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			approve = await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			approve = await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			const add = await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);

			const log1 = await this.gymFarming.connect(accounts.caller).deposit(pid, amount);

			let pendingReward = await this.gymFarming.pendingReward(pid, accounts.caller.address);
			expect(pendingReward).to.equal(0);

			await advanceBlockTo(this.startBlock + blockToAdvance);

			pendingReward = await this.gymFarming.pendingReward(pid, accounts.caller.address);
			expect(pendingReward).to.equal(
				await this.gymFarming.getMultiplier(this.startBlock, this.startBlock + blockToAdvance)
			);

			harvesttx = await this.gymFarming.connect(accounts.caller).harvest(pid);
			expect(await this.gym.balanceOf(accounts.caller.address)).to.equal(
				await this.gymFarming.getMultiplier(this.startBlock, this.startBlock + blockToAdvance + 1)
			);
		});

		it("PendingReward should equal ExpectedGym (2 signers in 1 pool): ", async function() {
			const pid = await this.gymFarming.poolLength();
			const blockToAdvance = 5;
			expect(pid).to.equal(0);

			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.chugun).approve(this.gymFarming.address, amount);

			await advanceBlockTo(this.startBlock + blockToAdvance);

			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);

			const log1 = await this.gymFarming.connect(accounts.caller).deposit(pid, amount);
			const log2 = await this.gymFarming.connect(accounts.chugun).deposit(pid, amount);

			const pendingRewardCaller = await this.gymFarming.pendingReward(pid, accounts.caller.address);
			let pendingRewardChugun = await this.gymFarming.pendingReward(pid, accounts.chugun.address);
			expect(pendingRewardCaller).to.equal(await this.gymFarming.rewardPerBlock());
			expect(pendingRewardChugun).to.equal(0);

			harvesttx = await this.gymFarming.connect(accounts.caller).harvest(pid);
			expect(await this.gym.balanceOf(accounts.caller.address)).to.equal(
				pendingRewardCaller.add((await this.gymFarming.rewardPerBlock()).div(2))
			);

			pendingRewardChugun = await this.gymFarming.pendingReward(pid, accounts.chugun.address);
			expect(pendingRewardChugun).to.equal((await this.gymFarming.rewardPerBlock()).div(2));

			harvesttx = await this.gymFarming.connect(accounts.chugun).harvest(pid);
			expect(await this.gym.balanceOf(accounts.chugun.address)).to.equal(
				(await this.gymFarming.getMultiplier(log2.blockNumber, harvesttx.blockNumber)).div(2)
			);
		});

		it("PendingReward should equal ExpectedGym(4 signers in 2 pools): ", async function() {
			const pid1 = await this.gymFarming.poolLength();
			const blockToAdvance = 0;
			expect(pid1).to.equal(0);

			await advanceBlockTo(this.startBlock + blockToAdvance);

			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);

			const pid2 = await this.gymFarming.poolLength();
			await this.gymFarming.add(poolAllocPoint2, this.testLp1.address, true);

			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.chugun).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.vzgo).approve(this.gymFarming.address, getBigNumber(2));
			await this.testLp1.connect(accounts.vzgo).approve(this.gymFarming.address, amount);
			await this.testLp1.connect(accounts.grno).approve(this.gymFarming.address, amount);

			const log1 = await this.gymFarming.connect(accounts.caller).deposit(pid1, amount);
			const log2 = await this.gymFarming.connect(accounts.chugun).deposit(pid1, amount);
			const log3 = await this.gymFarming.connect(accounts.vzgo).deposit(pid1, getBigNumber(2));

			pendingReward3 = await this.gymFarming.pendingReward(pid1, accounts.vzgo.address);
			pendingReward2 = await this.gymFarming.pendingReward(pid1, accounts.chugun.address);
			pendingReward1 = await this.gymFarming.pendingReward(pid1, accounts.caller.address);

			expect(pendingReward3).to.equal(0);
			expect(pendingReward2).to.equal((await this.gymFarming.rewardPerBlock()).div(4));
			expect(pendingReward1).to.equal((await this.gymFarming.rewardPerBlock()).div(2).add(pendingReward2));

			const log4 = await this.gymFarming.connect(accounts.vzgo).deposit(pid2, amount);
			const log5 = await this.gymFarming.connect(accounts.grno).deposit(pid2, amount);

			pendingReward5 = await this.gymFarming.pendingReward(pid2, accounts.grno.address);
			pendingReward4 = await this.gymFarming.pendingReward(pid2, accounts.vzgo.address);

			expect(pendingReward5).to.equal(0);
			expect(pendingReward4).to.equal((await this.gymFarming.rewardPerBlock()).div(2));
			harvesttx = await this.gymFarming.connect(accounts.caller).harvest(pid1);

			expect(await this.gym.balanceOf(accounts.caller.address)).to.equal(
				(await this.gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber))
					.div(5)
					.add(pendingReward1)
			);

			harvesttx = await this.gymFarming.connect(accounts.chugun).harvest(pid1);
			expect(await this.gym.balanceOf(accounts.chugun.address)).to.equal(
				(await this.gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber))
					.div(5)
					.add(pendingReward2)
			);

			harvesttx = await this.gymFarming.connect(accounts.vzgo).harvest(pid1);
			expect(await this.gym.balanceOf(accounts.vzgo.address)).to.equal(
				(await this.gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber))
					.div(10)
					.add(pendingReward3)
			);

			vzgoGym = await this.gym.balanceOf(accounts.vzgo.address);

			harvesttx = await this.gymFarming.connect(accounts.vzgo).harvest(pid2);
			expect((await this.gym.balanceOf(accounts.vzgo.address)).sub(vzgoGym)).to.equal(
				(await this.gymFarming.getMultiplier(log5.blockNumber, harvesttx.blockNumber))
					.div(4)
					.add(pendingReward4)
			);

			harvesttx = await this.gymFarming.connect(accounts.grno).harvest(pid2);
			expect(await this.gym.balanceOf(accounts.grno.address)).to.equal(
				(await this.gymFarming.getMultiplier(log5.blockNumber, harvesttx.blockNumber))
					.div(4)
					.add(pendingReward5)
			);
		});
	});

	describe("setRewardPerBlock function", function() {
		before("Before: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});
		it("Should change rewardPerBlock:", async function() {
			const rewardPerBlock = await this.gymFarming.rewardPerBlock();

			await advanceBlockTo(this.startBlock + 15);

			expect(await this.gymFarming.rewardPerBlock()).to.equal(rewardPerBlock);

			await advanceBlockTo(this.startBlock + 20);

			await this.gymFarming.setRewardPerBlock();

			expect(Math.floor(ethers.BigNumber.from(await this.gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.gymFarming[0]) / 1e12)
			);

			await advanceBlockTo(this.startBlock + 41);

			await this.gymFarming.setRewardPerBlock();

			expect(Math.floor(ethers.BigNumber.from(await this.gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.gymFarming[0] ** 2) / 1e12 ** 2)
			);

			await advanceBlockTo(this.startBlock + 62);

			await this.gymFarming.setRewardPerBlock();

			expect(Math.floor(ethers.BigNumber.from(await this.gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.gymFarming[0] ** 3) / 1e12 ** 3)
			);

			await advanceBlockTo(this.startBlock + 890);

			await this.gymFarming.setRewardPerBlock();

			expect(Math.floor(ethers.BigNumber.from(await this.gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.gymFarming[0] ** 3) / 1e12 ** 3)
			);
		});
	});

	describe("Add function: ", function() {
		before("Before: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});
		after("After tests: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});
		it("Should add new pool for deposit: ", async function() {
			const pid = await this.gymFarming.poolLength();
			const tx = await this.gymFarming.add(poolAllocPoint2, this.testLp.address, true);

			expect((await this.gymFarming.poolInfo(pid)).lpToken).to.equal(this.testLp.address);
			expect((await this.gymFarming.poolInfo(pid)).allocPoint).to.equal(poolAllocPoint2);
			expect((await this.gymFarming.poolInfo(pid)).lastRewardBlock).to.equal(this.startBlock);
			expect((await this.gymFarming.poolInfo(pid)).accRewardPerShare).to.equal(0);
		});
	});

	describe("Deposit function: ", function() {
		before("Before: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should deposit in pool: ", async function() {
			const pid = await this.gymFarming.poolLength();
			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, true);

			const accountLp = await this.testLp.balanceOf(accounts.caller.address);

			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.gymFarming.connect(accounts.caller).deposit(pid, amount);

			expect(await this.testLp.balanceOf(accounts.caller.address)).to.equal(accountLp.sub(amount));
			expect(await this.testLp.balanceOf(this.gymFarming.address)).to.equal(amount); // contractLp
		});
	});

	describe("Withdraw function: ", function() {
		before("Before: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Withdraw lps from pool: ", async function() {
			const pid = await this.gymFarming.poolLength();

			tx = await this.gymFarming.add(poolAllocPoint2, this.testLp.address, true);

			const accountLp = await this.testLp.balanceOf(accounts.caller.address);
			const contractLp = await this.testLp.balanceOf(this.gymFarming.address);
			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.gymFarming.connect(accounts.caller).deposit(pid, amount);
			await advanceBlock();
			await this.gymFarming.connect(accounts.caller).withdraw(pid, amount);

			expect((await this.testLp.balanceOf(accounts.caller.address)).toString()).to.equal(accountLp);
			expect((await this.testLp.balanceOf(this.gymFarming.address)).toString()).to.equal(contractLp);
		});
	});

	describe("HarvestAll function: ", function() {
		before("Before: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);
			await this.gymFarming.add(poolAllocPoint1, this.testLp1.address, true);
		});

		after("After tests: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should HarvestAll: Call HarvestAll function to get all assets at ones ", async function() {
			await this.testLp.connect(accounts.vzgo).approve(this.gymFarming.address, amount);
			await this.testLp1.connect(accounts.vzgo).approve(this.gymFarming.address, amount);

			await this.gymFarming.connect(accounts.vzgo).deposit(0, amount);
			expect((await this.gymFarming.poolInfo(0)).lastRewardBlock).to.equal(this.startBlock);

			await this.gymFarming.connect(accounts.vzgo).deposit(1, amount);
			expect((await this.gymFarming.poolInfo(0)).lastRewardBlock).to.equal(this.startBlock);

			await advanceBlockTo((await this.gymFarming.poolInfo(0)).lastRewardBlock.add(10));

			await this.gymFarming.connect(accounts.vzgo).harvestAll();

			expect((await this.gymFarming.userInfo(0, accounts.vzgo.address)).rewardDebt).to.not.equal(
				ethers.constants.Zero
			);
			expect((await this.gymFarming.userInfo(1, accounts.vzgo.address)).rewardDebt).to.not.equal(
				ethers.constants.Zero
			);
		});
	});

	describe("SpeedStake function: ", function() {
		// only work when forked
		let router, factory, lpToken;
		before("Before: ", async function() {
			router = await ethers.getContractAt("IPancakeRouter02", "0x10ED43C718714eb63d5aA57B78B54704E256024E");
			factory = await ethers.getContractAt("IPancakeFactory", await router.factory());

			await this.gym.connect(accounts.holder).approve(router.address, ethers.utils.parseEther("10"));

			await router
				.connect(accounts.holder)
				.addLiquidityETH(
					this.gym.address,
					ethers.utils.parseEther("10"),
					0,
					0,
					accounts.holder.address,
					new Date().getTime() + 20,
					{
						value: ethers.utils.parseEther("10")
					}
				);

			lpToken = await factory.getPair(this.gym.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
		});
		beforeEach("BeforeEach: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await this.gymFarming.add(poolAllocPoint2, lpToken, true);
		});

		afterEach("AfterEach: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should deposit in pool: ", async function() {
			await expect(() =>
				this.gymFarming.connect(accounts.holder).speedStake(0, 0, 0, 0, 0, new Date().getTime() + 20, {
					value: ethers.utils.parseEther("10")
				})
			).to.changeTokenBalances(this.gym, [accounts.holder], [0]);

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount).to.not.equal(0);
		});

		it("Should deposit in pool: ", async function() {
			await this.gym.connect(accounts.holder).approve(this.gymFarming.address, ethers.utils.parseEther("10"));
			await expect(() =>
				this.gymFarming
					.connect(accounts.holder)
					.speedStake(0, ethers.utils.parseEther("10"), 0, 0, 0, new Date().getTime() + 20, {
						value: ethers.utils.parseEther("10")
					})
			).to.changeTokenBalances(
				this.gym,
				[accounts.holder],
				[ethers.utils.parseEther("10").mul(ethers.constants.NegativeOne)]
			);

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount).to.not.equal(0);
		});

		it("Should deposit in pool: ", async function() {
			await this.gym.connect(accounts.holder).approve(this.gymFarming.address, ethers.utils.parseEther("10"));
			await expect(() =>
				this.gymFarming
					.connect(accounts.holder)
					.speedStake(0, ethers.utils.parseEther("10"), 0, 0, 0, new Date().getTime() + 20)
			).to.changeTokenBalances(
				this.gym,
				[accounts.holder],
				[ethers.utils.parseEther("10").mul(ethers.constants.NegativeOne)]
			);

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount).to.not.equal(0);
		});
	});

	describe("ClaimAndDeposit function: ", function() {
		// only work when forked
		let router, factory, lpToken;
		before("Before: ", async function() {
			router = await ethers.getContractAt("IPancakeRouter02", "0x10ED43C718714eb63d5aA57B78B54704E256024E");
			factory = await ethers.getContractAt("IPancakeFactory", await router.factory());

			await this.gym.connect(accounts.holder).approve(router.address, ethers.utils.parseEther("10"));

			await router
				.connect(accounts.holder)
				.addLiquidityETH(
					this.gym.address,
					ethers.utils.parseEther("10"),
					0,
					0,
					accounts.holder.address,
					new Date().getTime() + 20,
					{
						value: ethers.utils.parseEther("10")
					}
				);

			lpToken = await factory.getPair(this.gym.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
		});
		beforeEach("BeforeEach: ", async function() {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await this.gymFarming.add(poolAllocPoint2, lpToken, true);
		});

		afterEach("AfterEach: ", async function() {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should claimA in pool: ", async function() {
			const tx = await this.gymFarming
				.connect(accounts.holder)
				.speedStake(0, 0, 0, 0, 0, new Date().getTime() + 20, {
					value: ethers.utils.parseEther("10")
				});

			await advanceBlockTo(tx.blockNumber + 200);
			const userAmount = (await this.gymFarming.userInfo(0, accounts.holder.address)).amount;
			await this.gymFarming.connect(accounts.holder).claimAndDeposit(0, 0, 0, 0, new Date().getTime() + 20);

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount.sub(userAmount)).to.not.equal(0);
		});

		it("Should claimA in pool: ", async function() {
			const tx = await this.gymFarming
				.connect(accounts.holder)
				.speedStake(0, 0, 0, 0, 0, new Date().getTime() + 20, {
					value: ethers.utils.parseEther("10")
				});

			await advanceBlockTo(tx.blockNumber + 200);
			const userAmount = (await this.gymFarming.userInfo(0, accounts.holder.address)).amount;
			await this.gymFarming.connect(accounts.holder).claimAndDeposit(0, 0, 0, 0, new Date().getTime() + 20, {
				value: ethers.utils.parseEther("1")
			});

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount.sub(userAmount)).to.not.equal(0);
		});
	});
});
