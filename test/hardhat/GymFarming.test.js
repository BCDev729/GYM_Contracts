const { expect } = require("chai");
const { advanceBlock, advanceBlockTo, getBigNumber } = require("../utilities");
const {
	deployments: { fixture, deploy },
	network,
	ethers: {
		utils: { parseEther },
		provider: { getBlockNumber },
		getContract,
		getNamedSigners,
		BigNumber,
		constants
	}
} = require("hardhat");
const variables = require("../../utils/constants/solpp")("hardhat");
const data = require("../../utils/constants/data/hardhat/GymFarming.json");


describe("GymFarming contract: ", function () {
	let accounts, deployer, caller, holder, chugun, vzgo, grno;
	let gymFarming, gym, startBlock, snapshotStart, testLp, testLp1;
	const amount = getBigNumber(4);
	const poolAllocPoint1 = 30;
	const poolAllocPoint2 = 50;
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({ caller, deployer, holder, chugun, vzgo, grno } = accounts);
		await fixture();
		gymFarming = await getContract("GymFarming", deployer);
		gym = await getContract("GymToken", caller);
		await gym.connect(holder).transfer(gymFarming.address, parseEther("1000000"));

		await deploy("testLp", {
			from: deployer.address,
			contract: "ERC20Mock",
			args: ["LP Token", "LPT", getBigNumber(amount.mul(5))],
			log: true
		});
		testLp = await getContract("testLp");
		await deploy("testLp1", {
			from: deployer.address,
			contract: "ERC20Mock",
			args: ["LP Tokenq", "LPT1", getBigNumber(amount.mul(5))],
			log: true
		});
		testLp1 = await getContract("testLp1");

		await testLp.transfer(caller.address, getBigNumber(amount));
		await testLp.transfer(chugun.address, getBigNumber(amount));
		await testLp.transfer(vzgo.address, getBigNumber(amount));
		await testLp1.transfer(vzgo.address, getBigNumber(amount));
		await testLp1.transfer(grno.address, getBigNumber(amount));

		startBlock = parseInt(await gymFarming.startBlock());
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values: ", async function () {
			expect(await gymFarming.rewardToken()).to.equal(gym.address);
			expect(await gymFarming.rewardPerBlock()).to.equal(parseEther(data.rewardPerBlock));
			expect(await gymFarming.startBlock()).to.equal(data.startBlock);
		});
	});

	describe("PoolLength function: ", function () {
		before("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("PoolLength should execute: ", async function () {
			await gymFarming.add(poolAllocPoint1, testLp.address, false);
			await gymFarming.add(poolAllocPoint2, testLp1.address, true);

			expect(await gymFarming.poolLength()).to.equal(2);
		});
	});

	describe("Set function: ", function () {
		beforeEach("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Should set new allocPoint for pid: ", async function () {
			await gymFarming.add(poolAllocPoint1, testLp.address, false);
			await gymFarming.add(poolAllocPoint2, testLp1.address, true);

			await gymFarming.set(0, poolAllocPoint2, true);
			await gymFarming.set(1, poolAllocPoint1, true);

			expect((await gymFarming.poolInfo(0)).allocPoint).to.equal(poolAllocPoint2);
			expect((await gymFarming.poolInfo(1)).allocPoint).to.equal(poolAllocPoint1);
		});

		it("Should revert if invalid pool", async function () {
			await expect(gymFarming.set(0, poolAllocPoint2, true)).to.be.revertedWith("Farming::UNKNOWN_POOL");
		});
	});

	describe("pendingReward function: ", function () {
		beforeEach("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("PendingReward should equal ExpectedGym: ", async function () {
			await advanceBlockTo(await getBlockNumber());
			const pid = await gymFarming.poolLength();
			const blockToAdvance = 35;
			expect(pid).to.equal(0);

			await testLp.connect(caller).approve(gymFarming.address, amount);
			await testLp.connect(caller).approve(gymFarming.address, amount);
			await testLp.connect(caller).approve(gymFarming.address, amount);
			await testLp.connect(caller).approve(gymFarming.address, amount);
			await testLp.connect(caller).approve(gymFarming.address, amount);
			await gymFarming.add(poolAllocPoint2, testLp.address, false);

			await gymFarming.connect(caller).deposit(pid, amount);

			let pendingReward = await gymFarming.pendingReward(pid, caller.address);
			expect(pendingReward).to.equal(0);

			await advanceBlockTo(startBlock + blockToAdvance);

			pendingReward = await gymFarming.pendingReward(pid, caller.address);
			expect(pendingReward).to.equal(await gymFarming.getMultiplier(startBlock, startBlock + blockToAdvance));

			await gymFarming.connect(caller).harvest(pid);
			expect(await gym.balanceOf(caller.address)).to.equal(
				await gymFarming.getMultiplier(startBlock, startBlock + blockToAdvance + 1)
			);
		});

		it("PendingReward should equal ExpectedGym (2 signers in 1 pool): ", async function () {
			const pid = await gymFarming.poolLength();
			const blockToAdvance = 5;
			expect(pid).to.equal(0);

			await testLp.connect(caller).approve(gymFarming.address, amount);
			await testLp.connect(chugun).approve(gymFarming.address, amount);

			await advanceBlockTo(startBlock + blockToAdvance);

			await gymFarming.add(poolAllocPoint2, testLp.address, false);

			await gymFarming.connect(caller).deposit(pid, amount);
			const log2 = await gymFarming.connect(chugun).deposit(pid, amount);

			const pendingRewardCaller = await gymFarming.pendingReward(pid, caller.address);
			let pendingRewardChugun = await gymFarming.pendingReward(pid, chugun.address);
			expect(pendingRewardCaller).to.equal(await gymFarming.rewardPerBlock());
			expect(pendingRewardChugun).to.equal(0);

			let harvesttx = await gymFarming.connect(caller).harvest(pid);
			expect(await gym.balanceOf(caller.address)).to.equal(
				pendingRewardCaller.add((await gymFarming.rewardPerBlock()).div(2))
			);

			pendingRewardChugun = await gymFarming.pendingReward(pid, chugun.address);
			expect(pendingRewardChugun).to.equal((await gymFarming.rewardPerBlock()).div(2));

			harvesttx = await gymFarming.connect(chugun).harvest(pid);
			expect(await gym.balanceOf(chugun.address)).to.equal(
				(await gymFarming.getMultiplier(log2.blockNumber, harvesttx.blockNumber)).div(2)
			);
		});

		it("PendingReward should equal ExpectedGym(4 signers in 2 pools): ", async function () {
			const pid1 = await gymFarming.poolLength();
			const blockToAdvance = 0;
			expect(pid1).to.equal(0);

			await advanceBlockTo(startBlock + blockToAdvance);

			await gymFarming.add(poolAllocPoint2, testLp.address, false);

			const pid2 = await gymFarming.poolLength();
			await gymFarming.add(poolAllocPoint2, testLp1.address, true);

			await testLp.connect(caller).approve(gymFarming.address, amount);
			await testLp.connect(chugun).approve(gymFarming.address, amount);
			await testLp.connect(vzgo).approve(gymFarming.address, getBigNumber(2));
			await testLp1.connect(vzgo).approve(gymFarming.address, amount);
			await testLp1.connect(grno).approve(gymFarming.address, amount);

			await gymFarming.connect(caller).deposit(pid1, amount);
			await gymFarming.connect(chugun).deposit(pid1, amount);
			const log3 = await gymFarming.connect(vzgo).deposit(pid1, getBigNumber(2));

			const pendingReward3 = await gymFarming.pendingReward(pid1, vzgo.address);
			const pendingReward2 = await gymFarming.pendingReward(pid1, chugun.address);
			const pendingReward1 = await gymFarming.pendingReward(pid1, caller.address);

			expect(pendingReward3).to.equal(0);
			expect(pendingReward2).to.equal((await gymFarming.rewardPerBlock()).div(4));
			expect(pendingReward1).to.equal((await gymFarming.rewardPerBlock()).div(2).add(pendingReward2));

			await gymFarming.connect(vzgo).deposit(pid2, amount);
			const log5 = await gymFarming.connect(grno).deposit(pid2, amount);

			const pendingReward5 = await gymFarming.pendingReward(pid2, grno.address);
			const pendingReward4 = await gymFarming.pendingReward(pid2, vzgo.address);

			expect(pendingReward5).to.equal(0);
			expect(pendingReward4).to.equal((await gymFarming.rewardPerBlock()).div(2));
			let harvesttx = await gymFarming.connect(caller).harvest(pid1);

			expect(await gym.balanceOf(caller.address)).to.equal(
				(await gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber)).div(5).add(pendingReward1)
			);

			harvesttx = await gymFarming.connect(chugun).harvest(pid1);
			expect(await gym.balanceOf(chugun.address)).to.equal(
				(await gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber)).div(5).add(pendingReward2)
			);

			harvesttx = await gymFarming.connect(vzgo).harvest(pid1);
			expect(await gym.balanceOf(vzgo.address)).to.equal(
				(await gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber)).div(10).add(pendingReward3)
			);

			const vzgoGym = await gym.balanceOf(vzgo.address);

			harvesttx = await gymFarming.connect(vzgo).harvest(pid2);
			expect((await gym.balanceOf(vzgo.address)).sub(vzgoGym)).to.equal(
				(await gymFarming.getMultiplier(log5.blockNumber, harvesttx.blockNumber)).div(4).add(pendingReward4)
			);

			harvesttx = await gymFarming.connect(grno).harvest(pid2);
			expect(await gym.balanceOf(grno.address)).to.equal(
				(await gymFarming.getMultiplier(log5.blockNumber, harvesttx.blockNumber)).div(4).add(pendingReward5)
			);
		});
	});

	describe("setRewardPerBlock function", function () {
		before("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});
		it("Should change rewardPerBlock:", async function () {
			const rewardPerBlock = await gymFarming.rewardPerBlock();

			await advanceBlockTo(startBlock + 15);

			expect(await gymFarming.rewardPerBlock()).to.equal(rewardPerBlock);

			await advanceBlockTo(startBlock + 20);

			await gymFarming.setRewardPerBlock();

			expect(Math.floor(BigNumber.from(await gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.GymFarming_COEFFICIENT) / 1e12)
			);

			await advanceBlockTo(startBlock + 41);

			await gymFarming.setRewardPerBlock();

			expect(Math.floor(BigNumber.from(await gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.GymFarming_COEFFICIENT ** 2) / 1e12 ** 2)
			);

			await advanceBlockTo(startBlock + 62);

			await gymFarming.setRewardPerBlock();

			expect(Math.floor(BigNumber.from(await gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.GymFarming_COEFFICIENT ** 3) / 1e12 ** 3)
			);

			await advanceBlockTo(startBlock + 890);

			await gymFarming.setRewardPerBlock();

			expect(Math.floor(BigNumber.from(await gymFarming.rewardPerBlock()))).to.equal(
				Math.floor((rewardPerBlock * variables.GymFarming_COEFFICIENT ** 3) / 1e12 ** 3)
			);
		});
	});

	describe("Add function: ", function () {
		before("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});
		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});
		it("Should add new pool for deposit: ", async function () {
			const pid = await gymFarming.poolLength();
			await gymFarming.add(poolAllocPoint2, testLp.address, true);

			expect((await gymFarming.poolInfo(pid)).lpToken).to.equal(testLp.address);
			expect((await gymFarming.poolInfo(pid)).allocPoint).to.equal(poolAllocPoint2);
			expect((await gymFarming.poolInfo(pid)).lastRewardBlock).to.equal(startBlock);
			expect((await gymFarming.poolInfo(pid)).accRewardPerShare).to.equal(0);
		});
	});

	describe("Deposit function: ", function () {
		beforeEach("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Should deposit in pool: ", async function () {
			const pid = await gymFarming.poolLength();
			await gymFarming.add(poolAllocPoint2, testLp.address, true);

			const accountLp = await testLp.balanceOf(caller.address);

			await testLp.connect(caller).approve(gymFarming.address, amount);
			await gymFarming.connect(caller).deposit(pid, amount);

			expect(await testLp.balanceOf(caller.address)).to.equal(accountLp.sub(amount));
			expect(await testLp.balanceOf(gymFarming.address)).to.equal(amount); // contractLp
		});

		it("Emit event Deposit", async function () {
			const pid = await gymFarming.poolLength();
			await gymFarming.add(poolAllocPoint2, testLp.address, true);

			await testLp.connect(accounts.caller).approve(gymFarming.address, amount);
			expect(await gymFarming.connect(accounts.caller).deposit(pid, amount))
				.to
				.emit(gymFarming, "Deposit")
				.withArgs(accounts.caller.address, pid, amount);
		});
	});

	describe("Withdraw function: ", function () {
		beforeEach("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Withdraw lps from pool: ", async function () {
			const pid = await gymFarming.poolLength();

			await gymFarming.add(poolAllocPoint2, testLp.address, true);

			const accountLp = await testLp.balanceOf(caller.address);
			const contractLp = await testLp.balanceOf(gymFarming.address);
			await testLp.connect(caller).approve(gymFarming.address, amount);
			await gymFarming.connect(caller).deposit(pid, amount);
			await advanceBlock();
			await gymFarming.connect(caller).withdraw(pid, amount);

			expect((await testLp.balanceOf(caller.address)).toString()).to.equal(accountLp);
			expect((await testLp.balanceOf(gymFarming.address)).toString()).to.equal(contractLp);
		});

		it("Emit event Withdraw", async function () {
			const pid = await gymFarming.poolLength();
			await gymFarming.add(poolAllocPoint2, testLp.address, true);

			await testLp.connect(accounts.caller).approve(gymFarming.address, amount);
			await gymFarming.connect(accounts.caller).deposit(pid, amount);
			await advanceBlock();
			expect(await gymFarming.connect(accounts.caller).withdraw(pid, amount))
				.to
				.emit(gymFarming, "Withdraw")
				.withArgs(accounts.caller.address, pid, amount);
		});

		it("Emit event Harvest", async function () {
			const pid = await gymFarming.poolLength();
			await gymFarming.add(poolAllocPoint2, testLp.address, true);

			await testLp.connect(accounts.caller).approve(gymFarming.address, amount);
			await gymFarming.connect(accounts.caller).deposit(pid, amount);
			await advanceBlock();
			const pending = await gymFarming.connect(accounts.caller).pendingReward(pid, accounts.caller.address);
			expect(await gymFarming.connect(accounts.caller).withdraw(pid, amount))
				.to
				.emit(gymFarming, "Harvest")
				.withArgs(accounts.caller.address, pid, pending);
		});
	});

	describe("HarvestAll function: ", function () {
		beforeEach("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Should HarvestAll: Call HarvestAll function to get all assets at ones ", async function () {
			await gymFarming.add(poolAllocPoint2, testLp.address, false);
			await gymFarming.add(poolAllocPoint1, testLp1.address, true);

			await testLp.connect(accounts.vzgo).approve(gymFarming.address, amount);
			await testLp1.connect(accounts.vzgo).approve(gymFarming.address, amount);

			await gymFarming.connect(vzgo).deposit(0, amount);
			expect((await gymFarming.poolInfo(0)).lastRewardBlock).to.equal(startBlock);

			await gymFarming.connect(vzgo).deposit(1, amount);
			expect((await gymFarming.poolInfo(0)).lastRewardBlock).to.equal(startBlock);

			await advanceBlockTo((await gymFarming.poolInfo(0)).lastRewardBlock.add(10));

			await gymFarming.connect(vzgo).harvestAll();

			expect((await gymFarming.userInfo(0, vzgo.address)).rewardDebt).to.not.equal(constants.Zero);
			expect((await gymFarming.userInfo(1, vzgo.address)).rewardDebt).to.not.equal(constants.Zero);
		});

		it("Emit Harvest event", async function () {
			await gymFarming.add(poolAllocPoint2, testLp.address, false);

			await testLp.connect(accounts.vzgo).approve(gymFarming.address, amount);

			await gymFarming.connect(accounts.vzgo).deposit(0, amount);

			// await advanceBlockTo((await gymFarming.poolInfo(0)).lastRewardBlock.add(10));
			// await gymFarming.connect(accounts.vzgo).harvestAll();
			const pending = await gymFarming.pendingReward(0, accounts.vzgo.address);
			console.log(pending);
			expect(await gymFarming.connect(accounts.vzgo).harvest(0))
				.to
				.emit(gymFarming, "Harvest")
				.withArgs(accounts.vzgo.address, 0, pending);
		});
	});
});
