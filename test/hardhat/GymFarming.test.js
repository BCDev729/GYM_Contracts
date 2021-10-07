const { expect } = require("chai");
const { advanceBlock, advanceBlockTo, prepare, deploy, getBigNumber } = require("../utilities");
const {
	deployments: { fixture },
	network,
	ethers: {
		utils: { parseEther },
		provider: { getBlockNumber },
		getContract,
		getContractAt,
		getNamedSigners,
		BigNumber,
		constants
	}
} = require("hardhat");
const variables = require("../../utils/constants/solpp")("hardhat");
const data = require("../../utils/constants/data/hardhat/GymFarming.json");

let accounts, deployer, caller, holder, chugun, vzgo, grno;
const amount = getBigNumber(4);
const poolAllocPoint1 = 30;
const poolAllocPoint2 = 50;

describe("GymFarming contract: ", function () {
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({ caller, deployer, holder, chugun, vzgo, grno } = accounts);
		await fixture();
		await prepare(this, ["ERC20Mock"]);

		this.gymFarming = await getContract("GymFarming", deployer);
		this.gym = await getContract("GymToken", caller);
		this.provider = await getContractAt("ILiquidityProvider", "0x2B1C93fFfF55E2620D6fb5DaD7D69A6a468C9731", caller);
		await this.gym.connect(holder).transfer(this.gymFarming.address, parseEther("1000000"));

		this.tokenA = await getContract("TokenA", caller);
		this.tokenB = await getContract("TokenB", caller);

		await deploy(this, [
			["testLp", this.ERC20Mock, ["LP Token", "LPT", getBigNumber(amount.mul(5))]],
			["testLp1", this.ERC20Mock, ["LP Token1", "LPT", getBigNumber(amount.mul(5))]]
		]);

		await this.testLp.transfer(caller.address, getBigNumber(amount));
		await this.testLp.transfer(chugun.address, getBigNumber(amount));
		await this.testLp.transfer(vzgo.address, getBigNumber(amount));
		await this.testLp1.transfer(vzgo.address, getBigNumber(amount));
		await this.testLp1.transfer(grno.address, getBigNumber(amount));

		this.startBlock = parseInt(await this.gymFarming.startBlock());
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values: ", async function () {
			expect(await this.gymFarming.rewardToken()).to.equal(this.gym.address);
			expect(await this.gymFarming.rewardPerBlock()).to.equal(parseEther(data.rewardPerBlock));
			expect(await this.gymFarming.startBlock()).to.equal(data.startBlock);
		});
	});

	describe("PoolLength function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("PoolLength should execute: ", async function () {
			await this.gymFarming.add(poolAllocPoint1, this.testLp.address, false);
			await this.gymFarming.add(poolAllocPoint2, this.testLp1.address, true);

			expect(await this.gymFarming.poolLength()).to.equal(2);
		});
	});

	describe("Set function: ", function () {
		beforeEach("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should set new allocPoint for pid: ", async function () {
			await this.gymFarming.add(poolAllocPoint1, this.testLp.address, false);
			await this.gymFarming.add(poolAllocPoint2, this.testLp1.address, true);

			await this.gymFarming.set(0, poolAllocPoint2, true);
			await this.gymFarming.set(1, poolAllocPoint1, true);

			expect((await this.gymFarming.poolInfo(0)).allocPoint).to.equal(poolAllocPoint2);
			expect((await this.gymFarming.poolInfo(1)).allocPoint).to.equal(poolAllocPoint1);
		});

		it("Should revert if invalid pool", async function () {
			await expect(this.gymFarming.set(0, poolAllocPoint2, true)).to.be.revertedWith("Farming::UNKNOWN_POOL");
		});
	});

	describe("pendingReward function: ", function () {
		beforeEach("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("PendingReward should equal ExpectedGym: ", async function () {
			await advanceBlockTo(await getBlockNumber());
			const pid = await this.gymFarming.poolLength();
			const blockToAdvance = 35;
			expect(pid).to.equal(0);

			await this.testLp.connect(caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(caller).approve(this.gymFarming.address, amount);
			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);

			await this.gymFarming.connect(caller).deposit(pid, amount);

			let pendingReward = await this.gymFarming.pendingReward(pid, caller.address);
			expect(pendingReward).to.equal(0);

			await advanceBlockTo(this.startBlock + blockToAdvance);

			pendingReward = await this.gymFarming.pendingReward(pid, caller.address);
			expect(pendingReward).to.equal(
				await this.gymFarming.getMultiplier(this.startBlock, this.startBlock + blockToAdvance)
			);

			await this.gymFarming.connect(caller).harvest(pid);
			expect(await this.gym.balanceOf(caller.address)).to.equal(
				await this.gymFarming.getMultiplier(this.startBlock, this.startBlock + blockToAdvance + 1)
			);
		});

		it("PendingReward should equal ExpectedGym (2 signers in 1 pool): ", async function () {
			const pid = await this.gymFarming.poolLength();
			const blockToAdvance = 5;
			expect(pid).to.equal(0);

			await this.testLp.connect(caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(chugun).approve(this.gymFarming.address, amount);

			await advanceBlockTo(this.startBlock + blockToAdvance);

			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);

			await this.gymFarming.connect(caller).deposit(pid, amount);
			const log2 = await this.gymFarming.connect(chugun).deposit(pid, amount);

			const pendingRewardCaller = await this.gymFarming.pendingReward(pid, caller.address);
			let pendingRewardChugun = await this.gymFarming.pendingReward(pid, chugun.address);
			expect(pendingRewardCaller).to.equal(await this.gymFarming.rewardPerBlock());
			expect(pendingRewardChugun).to.equal(0);

			let harvesttx = await this.gymFarming.connect(caller).harvest(pid);
			expect(await this.gym.balanceOf(caller.address)).to.equal(
				pendingRewardCaller.add((await this.gymFarming.rewardPerBlock()).div(2))
			);

			pendingRewardChugun = await this.gymFarming.pendingReward(pid, chugun.address);
			expect(pendingRewardChugun).to.equal((await this.gymFarming.rewardPerBlock()).div(2));

			harvesttx = await this.gymFarming.connect(chugun).harvest(pid);
			expect(await this.gym.balanceOf(chugun.address)).to.equal(
				(await this.gymFarming.getMultiplier(log2.blockNumber, harvesttx.blockNumber)).div(2)
			);
		});

		it("PendingReward should equal ExpectedGym(4 signers in 2 pools): ", async function () {
			const pid1 = await this.gymFarming.poolLength();
			const blockToAdvance = 0;
			expect(pid1).to.equal(0);

			await advanceBlockTo(this.startBlock + blockToAdvance);

			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);

			const pid2 = await this.gymFarming.poolLength();
			await this.gymFarming.add(poolAllocPoint2, this.testLp1.address, true);

			await this.testLp.connect(caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(chugun).approve(this.gymFarming.address, amount);
			await this.testLp.connect(vzgo).approve(this.gymFarming.address, getBigNumber(2));
			await this.testLp1.connect(vzgo).approve(this.gymFarming.address, amount);
			await this.testLp1.connect(grno).approve(this.gymFarming.address, amount);

			await this.gymFarming.connect(caller).deposit(pid1, amount);
			await this.gymFarming.connect(chugun).deposit(pid1, amount);
			const log3 = await this.gymFarming.connect(vzgo).deposit(pid1, getBigNumber(2));

			const pendingReward3 = await this.gymFarming.pendingReward(pid1, vzgo.address);
			const pendingReward2 = await this.gymFarming.pendingReward(pid1, chugun.address);
			const pendingReward1 = await this.gymFarming.pendingReward(pid1, caller.address);

			expect(pendingReward3).to.equal(0);
			expect(pendingReward2).to.equal((await this.gymFarming.rewardPerBlock()).div(4));
			expect(pendingReward1).to.equal((await this.gymFarming.rewardPerBlock()).div(2).add(pendingReward2));

			await this.gymFarming.connect(vzgo).deposit(pid2, amount);
			const log5 = await this.gymFarming.connect(grno).deposit(pid2, amount);

			const pendingReward5 = await this.gymFarming.pendingReward(pid2, grno.address);
			const pendingReward4 = await this.gymFarming.pendingReward(pid2, vzgo.address);

			expect(pendingReward5).to.equal(0);
			expect(pendingReward4).to.equal((await this.gymFarming.rewardPerBlock()).div(2));
			let harvesttx = await this.gymFarming.connect(caller).harvest(pid1);

			expect(await this.gym.balanceOf(caller.address)).to.equal(
				(await this.gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber))
					.div(5)
					.add(pendingReward1)
			);

			harvesttx = await this.gymFarming.connect(chugun).harvest(pid1);
			expect(await this.gym.balanceOf(chugun.address)).to.equal(
				(await this.gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber))
					.div(5)
					.add(pendingReward2)
			);

			harvesttx = await this.gymFarming.connect(vzgo).harvest(pid1);
			expect(await this.gym.balanceOf(vzgo.address)).to.equal(
				(await this.gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber))
					.div(10)
					.add(pendingReward3)
			);

			const vzgoGym = await this.gym.balanceOf(vzgo.address);

			harvesttx = await this.gymFarming.connect(vzgo).harvest(pid2);
			expect((await this.gym.balanceOf(vzgo.address)).sub(vzgoGym)).to.equal(
				(await this.gymFarming.getMultiplier(log5.blockNumber, harvesttx.blockNumber))
					.div(4)
					.add(pendingReward4)
			);

			harvesttx = await this.gymFarming.connect(grno).harvest(pid2);
			expect(await this.gym.balanceOf(grno.address)).to.equal(
				(await this.gymFarming.getMultiplier(log5.blockNumber, harvesttx.blockNumber))
					.div(4)
					.add(pendingReward5)
			);
		});
	});

	describe("setRewardPerBlock function", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});
		it("Should change rewardPerBlock:", async function () {
			const rewardPerBlock = await this.gymFarming.rewardPerBlock();

			await advanceBlockTo(this.startBlock + 15);

			expect(await this.gymFarming.rewardPerBlock()).to.equal(rewardPerBlock);

			await advanceBlockTo(this.startBlock + 20);

			await this.gymFarming.setRewardPerBlock();

			expect(Math.floor(BigNumber.from(await this.gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.GymFarming_COEFFICIENT) / 1e12)
			);

			await advanceBlockTo(this.startBlock + 41);

			await this.gymFarming.setRewardPerBlock();

			expect(Math.floor(BigNumber.from(await this.gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.GymFarming_COEFFICIENT ** 2) / 1e12 ** 2)
			);

			await advanceBlockTo(this.startBlock + 62);

			await this.gymFarming.setRewardPerBlock();

			expect(Math.floor(BigNumber.from(await this.gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.GymFarming_COEFFICIENT ** 3) / 1e12 ** 3)
			);

			await advanceBlockTo(this.startBlock + 890);

			await this.gymFarming.setRewardPerBlock();

			expect(Math.floor(BigNumber.from(await this.gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.GymFarming_COEFFICIENT ** 3) / 1e12 ** 3)
			);
		});
	});

	describe("Add function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});
		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});
		it("Should add new pool for deposit: ", async function () {
			const pid = await this.gymFarming.poolLength();
			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, true);

			expect((await this.gymFarming.poolInfo(pid)).lpToken).to.equal(this.testLp.address);
			expect((await this.gymFarming.poolInfo(pid)).allocPoint).to.equal(poolAllocPoint2);
			expect((await this.gymFarming.poolInfo(pid)).lastRewardBlock).to.equal(this.startBlock);
			expect((await this.gymFarming.poolInfo(pid)).accRewardPerShare).to.equal(0);
		});
	});

	describe("Deposit function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should deposit in pool: ", async function () {
			const pid = await this.gymFarming.poolLength();
			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, true);

			const accountLp = await this.testLp.balanceOf(caller.address);

			await this.testLp.connect(caller).approve(this.gymFarming.address, amount);
			await this.gymFarming.connect(caller).deposit(pid, amount);

			expect(await this.testLp.balanceOf(caller.address)).to.equal(accountLp.sub(amount));
			expect(await this.testLp.balanceOf(this.gymFarming.address)).to.equal(amount); // contractLp
		});
	});

	describe("Withdraw function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Withdraw lps from pool: ", async function () {
			const pid = await this.gymFarming.poolLength();

			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, true);

			const accountLp = await this.testLp.balanceOf(caller.address);
			const contractLp = await this.testLp.balanceOf(this.gymFarming.address);
			await this.testLp.connect(caller).approve(this.gymFarming.address, amount);
			await this.gymFarming.connect(caller).deposit(pid, amount);
			await advanceBlock();
			await this.gymFarming.connect(caller).withdraw(pid, amount);

			expect((await this.testLp.balanceOf(caller.address)).toString()).to.equal(accountLp);
			expect((await this.testLp.balanceOf(this.gymFarming.address)).toString()).to.equal(contractLp);
		});
	});

	describe("HarvestAll function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);
			await this.gymFarming.add(poolAllocPoint1, this.testLp1.address, true);
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should HarvestAll: Call HarvestAll function to get all assets at ones ", async function () {
			await this.testLp.connect(vzgo).approve(this.gymFarming.address, amount);
			await this.testLp1.connect(vzgo).approve(this.gymFarming.address, amount);

			await this.gymFarming.connect(vzgo).deposit(0, amount);
			expect((await this.gymFarming.poolInfo(0)).lastRewardBlock).to.equal(this.startBlock);

			await this.gymFarming.connect(vzgo).deposit(1, amount);
			expect((await this.gymFarming.poolInfo(0)).lastRewardBlock).to.equal(this.startBlock);

			await advanceBlockTo((await this.gymFarming.poolInfo(0)).lastRewardBlock.add(10));

			await this.gymFarming.connect(vzgo).harvestAll();

			expect((await this.gymFarming.userInfo(0, vzgo.address)).rewardDebt).to.not.equal(constants.Zero);
			expect((await this.gymFarming.userInfo(1, vzgo.address)).rewardDebt).to.not.equal(constants.Zero);
		});
	});
});
