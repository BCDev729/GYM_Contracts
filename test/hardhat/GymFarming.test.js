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
	},
	run
} = require("hardhat");
const variables = require("../../utils/constants/solpp")("hardhat");
const data = require("../../utils/constants/data/hardhat/GymFarming.json");

let accounts;
const amount = getBigNumber(4);
const poolAllocPoint1 = 30;
const poolAllocPoint2 = 50;

describe("GymFarming contract: ", function () {
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		await fixture();
		await prepare(this, ["ERC20Mock"]);

		this.gymFarming = await getContract("GymFarming", accounts.deployer);
		this.gym = await getContract("GymToken", accounts.caller);
		this.provider = await getContractAt(
			"ILiquidityProvider",
			"0x2B1C93fFfF55E2620D6fb5DaD7D69A6a468C9731",
			accounts.caller
		);
		await this.gym.connect(accounts.holder).transfer(this.gymFarming.address, parseEther("1000000"));

		this.tokenA = await getContract("TokenA", accounts.caller);
		this.tokenB = await getContract("TokenB", accounts.caller);

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
			await run("farming:add", {
				allocPoint: `${poolAllocPoint1}`,
				lpToken: this.testLp.address,
				withUpdate: "false"
			});
			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp1.address,
				withUpdate: "true"
			});
			// await this.gymFarming.add(poolAllocPoint1, this.testLp.address, false);
			// await this.gymFarming.add(poolAllocPoint2, this.testLp1.address, true);

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
			await run("farming:add", {
				allocPoint: `${poolAllocPoint1}`,
				lpToken: this.testLp.address,
				withUpdate: "false"
			});
			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp1.address,
				withUpdate: "true"
			});
			// await this.gymFarming.add(poolAllocPoint1, this.testLp.address, false);
			// await this.gymFarming.add(poolAllocPoint2, this.testLp1.address, true);
			await run("farming:set", {
				pid: "0",
				allocPoint: `${poolAllocPoint2}`,
				withUpdate: "true"
			});
			await run("farming:set", {
				pid: "1",
				allocPoint: `${poolAllocPoint1}`,
				withUpdate: "true"
			});
			// await this.gymFarming.set(0, poolAllocPoint2, true);
			// await this.gymFarming.set(1, poolAllocPoint1, true);

			expect((await this.gymFarming.poolInfo(0)).allocPoint).to.equal(poolAllocPoint2);
			expect((await this.gymFarming.poolInfo(1)).allocPoint).to.equal(poolAllocPoint1);
		});

		it("Should revert if invalid pool", async function () {
			await expect(
				run("farming:set", {
					pid: "0",
					allocPoint: `${poolAllocPoint2}`,
					withUpdate: "true"
				})
			).to.be.revertedWith("Farming::UNKNOWN_POOL");
			// await expect(this.gymFarming.set(0, poolAllocPoint2, true)).to.be.revertedWith("Farming::UNKNOWN_POOL");
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

			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp.address,
				withUpdate: "false"
			});

			// await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);

			await run("farming:deposit", {
				pid: `${pid}`,
				amount: `${amount}`
			});

			// await this.gymFarming.connect(accounts.caller).deposit(pid, amount);

			let pendingReward = await run("farming:pendingReward", {
				pid: `${pid}`,
				caller: "deployer"
			});
			// let pendingReward = await this.gymFarming.pendingReward(pid, accounts.caller.address);
			expect(pendingReward).to.equal(0);

			await advanceBlockTo(this.startBlock + blockToAdvance);

			pendingReward = await run("farming:pendingReward", {
				pid: `${pid}`,
				caller: "deployer"
			});

			// pendingReward = await this.gymFarming.pendingReward(pid, accounts.caller.address);

			expect(pendingReward).to.equal(
				await run("farming:getMultiplier", {
					from: `${this.startBlock}`,
					to: `${this.startBlock + blockToAdvance}`,
					caller: "deployer"
				})
			);

			// expect(pendingReward).to.equal(
			// 	await this.gymFarming.getMultiplier(this.startBlock, this.startBlock + blockToAdvance)
			// );

			await run("farming:harvest", {
				pid: `${pid}`
			});

			// await this.gymFarming.connect(accounts.caller).harvest(pid);
			expect(await this.gym.balanceOf(accounts.caller.address)).to.equal(
				await run("farming:getMultiplier", {
					from: `${this.startBlock}`,
					to: `${this.startBlock + blockToAdvance + 1}`,
					caller: "deployer"
				})
			);
			// expect(await this.gym.balanceOf(accounts.caller.address)).to.equal(
			// 	await this.gymFarming.getMultiplier(this.startBlock, this.startBlock + blockToAdvance + 1)
			// );
		});

		it("PendingReward should equal ExpectedGym (2 signers in 1 pool): ", async function () {
			const pid = await this.gymFarming.poolLength();
			const blockToAdvance = 5;
			expect(pid).to.equal(0);

			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.chugun).approve(this.gymFarming.address, amount);

			await advanceBlockTo(this.startBlock + blockToAdvance);
			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp.address,
				withUpdate: "false"
			});

			// await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);

			await run("farming:deposit", {
				pid: `${pid}`,
				amount: `${amount}`
			});

			// await this.gymFarming.connect(accounts.caller).deposit(pid, amount);
			const log2 = await run("farming:deposit", {
				pid: `${pid}`,
				amount: `${amount}`,
				caller: "chugun"
			});
			// const log2 = await this.gymFarming.connect(accounts.chugun).deposit(pid, amount);
			const pendingRewardCaller = await run("farming:pendingReward", {
				pid: `${pid}`,
				caller: "deployer"
			});
			let pendingRewardChugun = await run("farming:pendingReward", {
				pid: `${pid}`,
				user: "chugun",
				caller: "deployer"
			});

			// const pendingRewardCaller = await this.gymFarming.pendingReward(pid, accounts.caller.address);
			// let pendingRewardChugun = await this.gymFarming.pendingReward(pid, accounts.chugun.address);
			expect(pendingRewardCaller).to.equal(await this.gymFarming.rewardPerBlock());
			expect(pendingRewardChugun).to.equal(0);

			let harvesttx = await run("farming:harvest", {
				pid: `${pid}`
			});

			// let harvesttx = await this.gymFarming.connect(accounts.caller).harvest(pid);
			expect(await this.gym.balanceOf(accounts.caller.address)).to.equal(
				pendingRewardCaller.add((await this.gymFarming.rewardPerBlock()).div(2))
			);

			pendingRewardChugun = await run("farming:pendingReward", {
				pid: `${pid}`,
				user: "chugun",
				caller: "deployer"
			});

			// pendingRewardChugun = await this.gymFarming.pendingReward(pid, accounts.chugun.address);
			expect(pendingRewardChugun).to.equal((await this.gymFarming.rewardPerBlock()).div(2));

			harvesttx = await run("farming:harvest", {
				pid: `${pid}`,
				caller: "chugun"
			});
			// harvesttx = await this.gymFarming.connect(accounts.chugun).harvest(pid);
			expect(await this.gym.balanceOf(accounts.chugun.address)).to.equal(
				(
					await run("farming:getMultiplier", {
						from: `${log2.blockNumber}`,
						to: `${harvesttx.blockNumber}`,
						caller: "deployer"
					})
				).div(2)
			);

			// expect(await this.gym.balanceOf(accounts.chugun.address)).to.equal(
			// 	(await this.gymFarming.getMultiplier(log2.blockNumber, harvesttx.blockNumber)).div(2)
			// );
		});

		it("PendingReward should equal ExpectedGym(4 signers in 2 pools): ", async function () {
			const pid1 = await this.gymFarming.poolLength();
			const blockToAdvance = 0;
			expect(pid1).to.equal(0);

			await advanceBlockTo(this.startBlock + blockToAdvance);

			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp.address,
				withUpdate: "false"
			});

			// await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);

			const pid2 = await this.gymFarming.poolLength();

			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp1.address,
				withUpdate: "true"
			});
			// await this.gymFarming.add(poolAllocPoint2, this.testLp1.address, true);

			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.chugun).approve(this.gymFarming.address, amount);
			await this.testLp.connect(accounts.vzgo).approve(this.gymFarming.address, getBigNumber(2));
			await this.testLp1.connect(accounts.vzgo).approve(this.gymFarming.address, amount);
			await this.testLp1.connect(accounts.grno).approve(this.gymFarming.address, amount);
			await run("farming:deposit", {
				pid: `${pid1}`,
				amount: `${amount}`
			});
			await run("farming:deposit", {
				pid: `${pid1}`,
				amount: `${amount}`,
				caller: "chugun"
			});
			const log3 = await run("farming:deposit", {
				pid: `${pid1}`,
				amount: `${getBigNumber(2)}`,
				caller: "vzgo"
			});
			// await this.gymFarming.connect(accounts.caller).deposit(pid1, amount);
			// await this.gymFarming.connect(accounts.chugun).deposit(pid1, amount);
			// const log3 = await this.gymFarming.connect(accounts.vzgo).deposit(pid1, getBigNumber(2));

			const pendingReward3 = await this.gymFarming.pendingReward(pid1, accounts.vzgo.address);
			const pendingReward2 = await this.gymFarming.pendingReward(pid1, accounts.chugun.address);
			const pendingReward1 = await this.gymFarming.pendingReward(pid1, accounts.caller.address);

			expect(pendingReward3).to.equal(0);
			expect(pendingReward2).to.equal((await this.gymFarming.rewardPerBlock()).div(4));
			expect(pendingReward1).to.equal((await this.gymFarming.rewardPerBlock()).div(2).add(pendingReward2));

			await run("farming:deposit", {
				pid: `${pid2}`,
				amount: `${amount}`,
				caller: "vzgo"
			});
			const log5 = await run("farming:deposit", {
				pid: `${pid2}`,
				amount: `${amount}`,
				caller: "grno"
			});
			// await this.gymFarming.connect(accounts.vzgo).deposit(pid2, amount);
			// const log5 = await this.gymFarming.connect(accounts.grno).deposit(pid2, amount);

			const pendingReward5 = await this.gymFarming.pendingReward(pid2, accounts.grno.address);
			const pendingReward4 = await this.gymFarming.pendingReward(pid2, accounts.vzgo.address);

			expect(pendingReward5).to.equal(0);
			expect(pendingReward4).to.equal((await this.gymFarming.rewardPerBlock()).div(2));
			let harvesttx = await run("farming:harvest", {
				pid: `${pid1}`
			});
			// let harvesttx = await this.gymFarming.connect(accounts.caller).harvest(pid1);
			expect(await this.gym.balanceOf(accounts.caller.address)).to.equal(
				(
					await run("farming:getMultiplier", {
						from: `${log3.blockNumber}`,
						to: `${harvesttx.blockNumber}`,
						caller: "deployer"
					})
				)
					.div(5)
					.add(pendingReward1)
			);
			// expect(await this.gym.balanceOf(accounts.caller.address)).to.equal(
			// 	(await this.gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber))
			// 		.div(5)
			// 		.add(pendingReward1)
			// );

			harvesttx = await run("farming:harvest", {
				pid: `${pid1}`,
				caller: "chugun"
			});
			// harvesttx = await this.gymFarming.connect(accounts.chugun).harvest(pid1);

			expect(await this.gym.balanceOf(accounts.chugun.address)).to.equal(
				(
					await run("farming:getMultiplier", {
						from: `${log3.blockNumber}`,
						to: `${harvesttx.blockNumber}`,
						caller: "deployer"
					})
				)
					.div(5)
					.add(pendingReward2)
			);

			// expect(await this.gym.balanceOf(accounts.chugun.address)).to.equal(
			// 	(await this.gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber))
			// 		.div(5)
			// 		.add(pendingReward2)
			// );
			harvesttx = await run("farming:harvest", {
				pid: `${pid1}`,
				caller: "vzgo"
			});

			// harvesttx = await this.gymFarming.connect(accounts.vzgo).harvest(pid1);
			expect(await this.gym.balanceOf(accounts.vzgo.address)).to.equal(
				(await this.gymFarming.getMultiplier(log3.blockNumber, harvesttx.blockNumber))
					.div(10)
					.add(pendingReward3)
			);

			const vzgoGym = await this.gym.balanceOf(accounts.vzgo.address);
			harvesttx = await run("farming:harvest", {
				pid: `${pid2}`,
				caller: "vzgo"
			});

			// harvesttx = await this.gymFarming.connect(accounts.vzgo).harvest(pid2);
			expect((await this.gym.balanceOf(accounts.vzgo.address)).sub(vzgoGym)).to.equal(
				(await this.gymFarming.getMultiplier(log5.blockNumber, harvesttx.blockNumber))
					.div(4)
					.add(pendingReward4)
			);

			harvesttx = await run("farming:harvest", {
				pid: `${pid2}`,
				caller: "grno"
			});

			// harvesttx = await this.gymFarming.connect(accounts.grno).harvest(pid2);
			expect(await this.gym.balanceOf(accounts.grno.address)).to.equal(
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
			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp.address,
				withUpdate: "true"
			});

			// await this.gymFarming.add(poolAllocPoint2, this.testLp.address, true);

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
			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp.address,
				withUpdate: "true"
			});

			// await this.gymFarming.add(poolAllocPoint2, this.testLp.address, true);

			const accountLp = await this.testLp.balanceOf(accounts.caller.address);

			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await run("farming:deposit", {
				pid: `${pid}`,
				amount: `${amount}`
			});
			// await this.gymFarming.connect(accounts.caller).deposit(pid, amount);

			expect(await this.testLp.balanceOf(accounts.caller.address)).to.equal(accountLp.sub(amount));
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
			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp.address,
				withUpdate: "true"
			});
			// await this.gymFarming.add(poolAllocPoint2, this.testLp.address, true);

			const accountLp = await this.testLp.balanceOf(accounts.caller.address);
			const contractLp = await this.testLp.balanceOf(this.gymFarming.address);
			await this.testLp.connect(accounts.caller).approve(this.gymFarming.address, amount);
			await run("farming:deposit", {
				pid: `${pid}`,
				amount: `${amount}`
			});

			// await this.gymFarming.connect(accounts.caller).deposit(pid, amount);
			await advanceBlock();
			await this.gymFarming.connect(accounts.caller).withdraw(pid, amount);

			expect((await this.testLp.balanceOf(accounts.caller.address)).toString()).to.equal(accountLp);
			expect((await this.testLp.balanceOf(this.gymFarming.address)).toString()).to.equal(contractLp);
		});
	});

	describe("HarvestAll function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
			await run("farming:add", {
				allocPoint: `${poolAllocPoint2}`,
				lpToken: this.testLp.address,
				withUpdate: "false"
			});
			await run("farming:add", {
				allocPoint: `${poolAllocPoint1}`,
				lpToken: this.testLp1.address,
				withUpdate: "true"
			});
			// await this.gymFarming.add(poolAllocPoint2, this.testLp.address, false);
			// await this.gymFarming.add(poolAllocPoint1, this.testLp1.address, true);
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should HarvestAll: Call HarvestAll function to get all assets at ones ", async function () {
			await this.testLp.connect(accounts.vzgo).approve(this.gymFarming.address, amount);
			await this.testLp1.connect(accounts.vzgo).approve(this.gymFarming.address, amount);
			await run("farming:deposit", {
				pid: "0",
				amount: `${amount}`,
				caller: "vzgo"
			});

			// await this.gymFarming.connect(accounts.vzgo).deposit(0, amount);
			expect((await this.gymFarming.poolInfo(0)).lastRewardBlock).to.equal(this.startBlock);
			await run("farming:deposit", {
				pid: "1",
				amount: `${amount}`,
				caller: "vzgo"
			});

			// await this.gymFarming.connect(accounts.vzgo).deposit(1, amount);
			expect((await this.gymFarming.poolInfo(0)).lastRewardBlock).to.equal(this.startBlock);

			await advanceBlockTo((await this.gymFarming.poolInfo(0)).lastRewardBlock.add(10));

			await run("farming:harvestAll", {
				caller: "vzgo"
			});
			// await this.gymFarming.connect(accounts.vzgo).harvestAll();

			expect((await this.gymFarming.userInfo(0, accounts.vzgo.address)).rewardDebt).to.not.equal(constants.Zero);
			expect((await this.gymFarming.userInfo(1, accounts.vzgo.address)).rewardDebt).to.not.equal(constants.Zero);
		});
	});
});
