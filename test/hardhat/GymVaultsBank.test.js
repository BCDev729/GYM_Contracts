const { expect } = require("chai");
const {
	deployments: { fixture, deploy },
	network,
	ethers: {
		getNamedSigners,
		getContract,
		utils: { parseEther },
		BigNumber,
		provider: { getBlockNumber }
	},
	run
} = require("hardhat");

const { advanceBlockTo } = require("./../utilities/time");
const testVars = require("./../utilities/testVariables.json");
const variables = require("../../utils/constants/solpp")("hardhat");

let accounts;
const rewardRate = parseEther("25.72864");
const startBlock = 200;

describe("GymVaultsBank contract: ", function () {
	before("Before All: ", async function () {
		await fixture();
		accounts = await getNamedSigners();
		this.wantToken1 = await getContract("WantToken1", accounts.caller);
		this.wantToken2 = await getContract("WantToken2", accounts.caller);
		this.gymToken = await getContract("GymToken", accounts.caller);
		this.relationship = await getContract("GymMLM", accounts.caller);
		this.farming = await getContract("GymFarming", accounts.deployer);
		await this.farming.connect(accounts.deployer).add(30, this.gymToken.address, false);
		this.buyBack = await getContract("BuyBack", accounts.caller);
		this.gymVaultsBank = await getContract("GymVaultsBank", accounts.deployer);
		this.WBNB = await getContract("WBNBMock", accounts.caller);
		this.earnToken = await getContract("EarnToken", accounts.caller);
		this.strategy1 = await getContract("StrategyMock1", accounts.deployer);
		this.strategy2 = await getContract("StrategyMock2", accounts.deployer);
		this.strategy = await getContract("StrategyMock", accounts.caller);
		this.routerMock = await getContract("RouterMock", accounts.caller);

		await run("gymMLM:setBankAddress", {
			bankAddress: this.gymVaultsBank.address,
			caller: "deployer"
		});

		await run("gymVaultsBank:setFarmingAddress", {
			farmingAddress: this.farming.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:setTreasuryAddress", {
			treasuryAddress: accounts.owner.address,
			caller: "deployer"
		});

		await run("gymVaultsBank:setWithdrawFee", {
			withdrawFee: "1000",
			caller: "deployer"
		});
		await this.WBNB.connect(accounts.deployer).deposit({
			value: parseEther("10")
		});
		await this.gymToken.connect(accounts.holder).transfer(this.gymVaultsBank.address, parseEther("10000"));
		await this.gymToken.connect(accounts.holder).delegate(this.buyBack.address);
		await this.WBNB.connect(accounts.deployer).transfer(this.routerMock.address, parseEther("10"));
		await accounts.deployer.sendTransaction({
			value: parseEther("5000"),
			to: this.routerMock.address
		});
		await this.gymToken.connect(accounts.holder).approve(this.routerMock.address, parseEther("1000"));
		await run("gymVaultsBank:add", {
			want: this.WBNB.address,
			allocPoint: "30",
			withUpdate: "false",
			strategy: this.strategy.address,
			caller: "deployer"
		});

		this.strategy3 = await getContract("StrategyMock3", accounts.deployer);

		await this.wantToken2.connect(accounts.deployer).transfer(accounts.vzgo.address, testVars.WANTTOKEN_AMOUNT / 4);
		await this.wantToken2.connect(accounts.deployer).transfer(accounts.grno.address, testVars.WANTTOKEN_AMOUNT / 4);
		await this.wantToken2
			.connect(accounts.deployer)
			.transfer(this.routerMock.address, testVars.WANTTOKEN_AMOUNT / 4);

		await this.wantToken1.connect(accounts.deployer).transfer(accounts.grno.address, testVars.WANTTOKEN_AMOUNT / 2);
		await this.wantToken1.connect(accounts.deployer).transfer(accounts.vzgo.address, testVars.WANTTOKEN_AMOUNT / 2);
		await this.gymToken.connect(accounts.holder).transfer(this.gymVaultsBank.address, 2000);
		await this.gymToken
			.connect(accounts.holder)
			.transfer(this.routerMock.address, parseEther(testVars.AMOUNT.toString()));
		await this.earnToken.connect(accounts.deployer).transfer(this.gymVaultsBank.address, 5000);
	});
	describe("Initialization: ", function () {
		beforeEach("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});

		it("Should initialize with correct parameters:", async function () {
			expect(await this.gymVaultsBank.RELATIONSHIP_REWARD()).to.equal(
				variables.GymVaultsBank_RELATIONSHIP_REWARD
			);
			expect(await this.gymVaultsBank.VAULTS_SAVING()).to.equal(variables.GymVaultsBank_VAULTS_SAVING);
			expect(await this.gymVaultsBank.BUY_AND_BURN_GYM()).to.equal(variables.GymVaultsBank_BUY_AND_BURN);
			expect(await this.gymVaultsBank.startBlock()).to.equal(startBlock);
			expect(await this.gymVaultsBank.rewardPoolInfo()).to.deep.equal([
				this.gymToken.address,
				BigNumber.from(rewardRate)
			]);
		});

		it("Should revert:GymVaultsBank: Start block must have a bigger value", async function () {
			const startBlock = await getBlockNumber();
			await advanceBlockTo(startBlock + 10);

			await expect(
				deploy("GymVaultsBank", {
					from: accounts.deployer.address,
					args: [startBlock, this.gymToken.address, rewardRate],
					log: true,
					deterministicDeployment: false
				})
			).to.be.revertedWith("GymVaultsBank: Start block must have a bigger value");
		});
	});

	describe("Reward Pool functions: ", function () {
		beforeEach("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});

		it("Should update RewardPerBlock", async function () {
			const rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
			await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 15);

			expect((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock).to.equal(rewardPerBlock);

			await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 20);

			await run("gymVaultsBank:updateRewardPerBlock", {
				caller: "deployer"
			});

			expect(Math.floor(BigNumber.from((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock))).to.equal(
				Math.floor((rewardPerBlock * variables.GymVaultsBank_COEFFICIENT) / 1e12)
			);

			await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 41);

			await run("gymVaultsBank:updateRewardPerBlock", {
				caller: "deployer"
			});

			expect(Math.floor(BigNumber.from((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock))).to.equal(
				Math.floor((rewardPerBlock * variables.GymVaultsBank_COEFFICIENT ** 2) / 1e12 ** 2)
			);

			await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 62);

			await run("gymVaultsBank:updateRewardPerBlock", {
				caller: "deployer"
			});

			expect(Math.floor(BigNumber.from((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock))).to.equal(
				Math.floor((rewardPerBlock * variables.GymVaultsBank_COEFFICIENT ** 3) / 1e12 ** 3)
			);

			await advanceBlockTo((await this.gymVaultsBank.startBlock()) + 90);

			await run("gymVaultsBank:updateRewardPerBlock", {
				caller: "deployer"
			});

			expect(Math.floor(BigNumber.from((await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock))).to.equal(
				Math.floor((rewardPerBlock * variables.GymVaultsBank_COEFFICIENT ** 3) / 1e12 ** 3)
			);
		});

		it("Should revert with message: Ownable: caller is not the owner", async function () {
			await expect(
				run("gymVaultsBank:updateRewardPerBlock", {
					caller: "caller"
				})
			).to.be.revertedWith("Ownable: caller is not the owner");
		});
	});

	describe("Add function: ", function () {
		const allocPoint = 20;
		const corePoolAllocPoint = 30;
		let poolLength;

		beforeEach("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});
		it("Should add Pool:", async function () {
			poolLength = await this.gymVaultsBank.poolLength();
			await advanceBlockTo((await getBlockNumber()) + 200);

			const tx = await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy1.address,
				caller: "deployer"
			});
			poolLength = poolLength.add(1);

			expect(await this.gymVaultsBank.poolLength()).to.equal(poolLength);
			expect(await this.gymVaultsBank.poolInfo(poolLength.sub(1))).to.deep.equal([
				this.wantToken2.address,
				BigNumber.from(20),
				BigNumber.from(tx.blockNumber),
				BigNumber.from(0),
				this.strategy1.address
			]);
			expect(await this.gymVaultsBank.totalAllocPoint()).to.equal(allocPoint + corePoolAllocPoint);
		});

		it("Should set new allocation point:", async function () {
			await advanceBlockTo((await getBlockNumber()) + 150);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy1.address,
				caller: "deployer"
			});
			const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();
			const poolAllocPoint = (await this.gymVaultsBank.poolInfo(poolLength.sub(1))).allocPoint;
			const newAllocPoint = BigNumber.from(30);

			await run("gymVaultsBank:set", {
				pid: `${poolLength.sub(1)}`,
				allocPoint: `${newAllocPoint}`,
				caller: "deployer"
			});
			expect(await this.gymVaultsBank.totalAllocPoint()).to.equal(
				totalAllocPoint.sub(poolAllocPoint).add(newAllocPoint)
			);
			expect((await this.gymVaultsBank.poolInfo(poolLength.sub(1))).allocPoint).to.equal(newAllocPoint);
		});

		it("Should: Reset Strategy", async function () {
			await advanceBlockTo((await getBlockNumber()) + 150);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy1.address,
				caller: "deployer"
			});

			await run("gymVaultsBank:resetStrategy", {
				pid: "1",
				strategy: this.strategy2.address,
				caller: "deployer"
			});
			expect((await this.gymVaultsBank.poolInfo(1)).strategy).to.equal(this.strategy2.address);

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);
			await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, testVars.AMOUNT);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "grno"
			});
			await expect(
				run("gymVaultsBank:resetStrategy", {
					pid: "1",
					strategy: this.strategy3.address,
					caller: "deployer"
				})
			).to.be.revertedWith("GymVaultsBank: Strategy not empty");
		});
	});

	describe("Deposit, Pending", function () {
		before(async function () {
			this.vzgoWant2Balance = await this.wantToken2.balanceOf(accounts.vzgo.address);
			this.grnoWant2Balance = await this.wantToken2.balanceOf(accounts.grno.address);
			this.grnoWant1Balance = await this.wantToken1.balanceOf(accounts.grno.address);
			this.rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
		});

		beforeEach("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});
		const allocPoint = 30;
		it("Should add deposit from vzgo, return correct stakedWantTokens count:", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);
			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});

			const poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;

			const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			expect(await this.wantToken2.balanceOf(accounts.vzgo.address)).to.equal(
				this.vzgoWant2Balance.sub(testVars.AMOUNT)
			);
			// const depositTime = (await ethers.provider.getBlock(tx.blockNumber)).timestamp;
			// expect((await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares).to.equal(testVars.AMOUNT * variables["GymVaultsBank_VAULTS_SAVING"] / 100)

			await advanceBlockTo((await getBlockNumber()) + testVars.BLOCK_COUNT);

			expect(
				await run("gymVaultsBank:stakedWantTokens", {
					pid: "1",
					user: accounts.vzgo.address
				})
			).to.equal((testVars.AMOUNT * variables.GymVaultsBank_VAULTS_SAVING) / 100);
			expect(
				BigNumber.from(
					await run("gymVaultsBank:pendingReward", {
						pid: "1",
						user: accounts.vzgo.address
					})
				).add(1)
			).to.equal(this.rewardPerBlock.mul(testVars.BLOCK_COUNT).mul(poolAllocPoint1).div(totalAllocPoint));
		});

		it("Should calculate rewards for 2 users in 1 pool:", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);
			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;

			const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);
			await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "grno"
			});

			expect(await this.wantToken2.balanceOf(accounts.vzgo.address)).to.equal(
				this.vzgoWant2Balance - testVars.AMOUNT
			);
			expect(await this.wantToken2.balanceOf(accounts.grno.address)).to.equal(
				this.grnoWant2Balance - testVars.AMOUNT
			);

			await advanceBlockTo((await getBlockNumber()) + testVars.BLOCK_COUNT);

			expect(
				BigNumber.from(
					await run("gymVaultsBank:pendingReward", {
						pid: "1",
						user: accounts.vzgo.address
					})
				).add(1)
			).to.equal(
				this.rewardPerBlock
					.mul(testVars.BLOCK_COUNT)
					.mul(poolAllocPoint1)
					.div(totalAllocPoint)
					.add(this.rewardPerBlock)
					.mul(poolAllocPoint1)
					.div(totalAllocPoint)
			);
			expect(
				await run("gymVaultsBank:pendingReward", {
					pid: "1",
					user: accounts.grno.address
				})
			).to.equal(this.rewardPerBlock.div(2).mul(testVars.BLOCK_COUNT).mul(poolAllocPoint1).div(totalAllocPoint));
		});

		it("Should calculate rewards for 2 users in 2 different pools:", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});

			await run("gymVaultsBank:add", {
				want: this.wantToken1.address,
				allocPoint: "40",
				withUpdate: "false",
				strategy: this.strategy1.address,
				caller: "deployer"
			});

			const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();
			const poolAllocPoint2 = (await this.gymVaultsBank.poolInfo(2)).allocPoint;

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);
			await this.wantToken1.connect(accounts.grno).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});
			await run("gymVaultsBank:deposit", {
				pid: "2",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "grno"
			});

			expect(await this.wantToken2.balanceOf(accounts.vzgo.address)).to.equal(
				this.vzgoWant2Balance - testVars.AMOUNT
			);
			expect(await this.wantToken1.balanceOf(accounts.grno.address)).to.equal(
				this.grnoWant1Balance - testVars.AMOUNT
			);

			await advanceBlockTo((await getBlockNumber()) + testVars.BLOCK_COUNT);
			// const currentBlock = await getBlockNumber();
			// expect(await this.gymVaultsBank.pendingReward(1, accounts.vzgo.address))
			//     .to.equal((ethers.BigNumber.from(currentBlock).sub(vzgoDeposit.blockNumber)).mul(this.rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint))
			expect(
				(
					await run("gymVaultsBank:pendingReward", {
						pid: "2",
						user: accounts.grno.address
					})
				).add(1)
			).to.equal(this.rewardPerBlock.mul(testVars.BLOCK_COUNT).mul(poolAllocPoint2).div(totalAllocPoint));
		});
	});

	describe("depositBNB", function () {
		before("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});
		it("Should deposit BNB", async function () {
			const vzgoBalance = await accounts.vzgo.getBalance();
			const allocPoint = 30;
			await advanceBlockTo((await getBlockNumber()) + startBlock);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});

			const tx = await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: `${parseEther(testVars.AMOUNT.toString())}`
			});

			const fee = (await tx.wait()).gasUsed * tx.gasPrice;
			const finalBalance = vzgoBalance - parseEther(testVars.AMOUNT.toString()) - fee;
			expect(Number(await accounts.vzgo.getBalance())).to.be.closeTo(
				Number(finalBalance),
				Number(parseEther("0.00000005"))
			);
			expect(Number((await this.gymVaultsBank.userInfo(0, accounts.vzgo.address)).shares)).to.equal(
				(variables.GymVaultsBank_VAULTS_SAVING / 100) * Number(parseEther(testVars.AMOUNT.toString()))
			);
		});
	});

	describe("Claim function: ", function () {
		beforeEach("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});

		it("Should claim rewards", async function () {
			const rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
			await advanceBlockTo((await getBlockNumber()) + startBlock);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: "30",
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;
			const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();
			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});
			await advanceBlockTo((await getBlockNumber()) + 150);

			const pending = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: accounts.vzgo.address
			});

			await run("gymVaultsBank:claim", {
				pid: "1",
				caller: "vzgo"
			});

			expect(await this.gymToken.balanceOf(accounts.vzgo.address)).to.equal(
				pending.add(rewardPerBlock.mul(poolAllocPoint1).div(totalAllocPoint))
			);
		});

		it("Should claimAll rewards", async function () {
			const rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;

			await advanceBlockTo((await getBlockNumber()) + startBlock);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: "30",
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: `${parseEther(testVars.AMOUNT.toString())}`
			});

			await advanceBlockTo((await getBlockNumber()) + 150);

			const pending0 = await run("gymVaultsBank:pendingReward", {
				pid: "0",
				user: accounts.vzgo.address
			});
			const pending1 = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: accounts.vzgo.address
			});

			await run("gymVaultsBank:claimAll", {
				caller: "vzgo"
			});

			expect(Math.floor(await this.gymToken.balanceOf(accounts.vzgo.address))).to.equal(
				Math.floor(pending0.add(pending1).add(rewardPerBlock))
			);
		});
	});

	describe("Withdraw", function () {
		before(async function () {
			this.vzgoWant2Balance = await this.wantToken2.balanceOf(accounts.vzgo.address);
			this.grnoWant2Balance = await this.wantToken2.balanceOf(accounts.grno.address);
			this.grnoWant1Balance = await this.wantToken1.balanceOf(accounts.grno.address);
			this.rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
		});
		beforeEach("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});
		const allocPoint = 30;
		it("Should transfer all assets to Vzgo(single user):", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;
			const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			const vzgoShares = (await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares;

			await advanceBlockTo((await getBlockNumber()) + testVars.BLOCK_COUNT);

			const pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: accounts.vzgo.address
			});

			await run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${vzgoShares}`,
				caller: "vzgo"
			});
			expect((await this.wantToken2.balanceOf(accounts.vzgo.address)).sub(1)).to.equal(
				Math.floor(
					this.vzgoWant2Balance -
						(testVars.AMOUNT *
							(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
							100 -
						vzgoShares / 10
				)
			);
			expect(BigNumber.from(await this.gymToken.balanceOf(accounts.vzgo.address))).to.equal(
				BigNumber.from(this.rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
			);
		});
		it("Should transfer part of  assets to Vzgo(single user):", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);
			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;
			const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			const vzgoShares = (await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares;

			await advanceBlockTo((await getBlockNumber()) + testVars.BLOCK_COUNT);

			const pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: accounts.vzgo.address
			});

			await run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${vzgoShares - 20}`,
				caller: "vzgo"
			});

			expect((await this.wantToken2.balanceOf(accounts.vzgo.address)).sub(1)).to.equal(
				Math.floor(
					this.vzgoWant2Balance -
						20 -
						(testVars.AMOUNT *
							(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
							100 -
						(vzgoShares - 20) / 10
				)
			);
			expect(BigNumber.from(await this.gymToken.balanceOf(accounts.vzgo.address))).to.equal(
				BigNumber.from(this.rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
			);
		});
		it("Should withdraw all assets (2 users in 1 pool):", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await this.gymVaultsBank.poolInfo(1)).allocPoint;

			await run("gymVaultsBank:add", {
				want: this.wantToken1.address,
				allocPoint: "40",
				withUpdate: "false",
				strategy: this.strategy1.address,
				caller: "deployer"
			});
			const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);
			await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "grno"
			});

			const vzgoShares = (await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares;
			const grnoShares = (await this.gymVaultsBank.userInfo(1, accounts.grno.address)).shares;

			await advanceBlockTo((await getBlockNumber()) + testVars.BLOCK_COUNT);

			let pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: accounts.vzgo.address
			});
			await run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${testVars.AMOUNT}`,
				caller: "vzgo"
			});

			expect((await this.wantToken2.balanceOf(accounts.vzgo.address)).sub(1)).to.equal(
				Math.floor(
					this.vzgoWant2Balance -
						(testVars.AMOUNT *
							(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
							100 -
						vzgoShares / 10
				)
			);
			expect(BigNumber.from(await this.gymToken.balanceOf(accounts.vzgo.address))).to.equal(
				BigNumber.from(this.rewardPerBlock.div(2).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward))
			);

			await advanceBlockTo((await getBlockNumber()) + testVars.BLOCK_COUNT);

			pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: accounts.grno.address
			});

			await run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${testVars.AMOUNT}`,
				caller: "grno"
			});

			expect((await this.wantToken2.balanceOf(accounts.grno.address)).sub(1)).to.equal(
				Math.floor(
					this.grnoWant2Balance -
						(testVars.AMOUNT *
							(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
							100 -
						grnoShares / 10
				)
			);
			expect(BigNumber.from(await this.gymToken.balanceOf(accounts.grno.address))).to.equal(
				BigNumber.from(this.rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
			);
		});
		it("Should transfer all assets(more than balance) safeTransfer check:", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);
			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});

			const bankGymBalance = await this.gymToken.balanceOf(this.gymVaultsBank.address);

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			const vzgoShares = (await this.gymVaultsBank.userInfo(1, accounts.vzgo.address)).shares;

			await advanceBlockTo((await getBlockNumber()) + 1000);

			await run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${testVars.AMOUNT}`,
				caller: "vzgo"
			});

			expect(await this.wantToken2.balanceOf(accounts.vzgo.address)).to.equal(
				this.vzgoWant2Balance
					.sub(
						(testVars.AMOUNT *
							(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
							100
					)
					.sub(vzgoShares.div(10))
			);
			expect(await this.gymToken.balanceOf(accounts.vzgo.address)).to.equal(bankGymBalance);
		});
	});

	describe("WithdrawBNB", function () {
		beforeEach("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});
		it("Should withdraw all shared amount and return BNB", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);
			const poolAllocPoint = (await this.gymVaultsBank.poolInfo(0)).allocPoint;
			const totalAllocPoint = await this.gymVaultsBank.totalAllocPoint();
			const rewardPerBlock = (await this.gymVaultsBank.rewardPoolInfo()).rewardPerBlock;

			const vzgoBalance = (await accounts.vzgo.getBalance()).toString();

			const depositTx = await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: `${parseEther(testVars.AMOUNT.toString())}`
			});
			const vzgoShares = (await this.gymVaultsBank.userInfo(0, accounts.vzgo.address)).shares;

			await advanceBlockTo((await getBlockNumber()) + testVars.BLOCK_COUNT);

			const pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "0",
				user: accounts.vzgo.address
			});

			const withdrawTx = await run("gymVaultsBank:withdraw", {
				pid: "0",
				wantAmt: `${parseEther(testVars.AMOUNT.toString())}`,
				caller: "vzgo"
			});

			const fee =
				(await depositTx.wait()).gasUsed * depositTx.gasPrice +
				(await withdrawTx.wait()).gasUsed * withdrawTx.gasPrice;

			expect(BigNumber.from(await accounts.vzgo.getBalance())).to.be.closeTo(
				BigNumber.from(vzgoBalance)
					.sub(
						BigNumber.from(parseEther(testVars.AMOUNT.toString()))
							.mul(
								BigNumber.from(variables.GymVaultsBank_BUY_AND_BURN).add(
									variables.GymVaultsBank_RELATIONSHIP_REWARD
								)
							)
							.div(100)
					)
					.sub(vzgoShares.div(10)),
				BigNumber.from(fee)
			);
			expect(await this.gymToken.balanceOf(accounts.vzgo.address)).to.be.closeTo(
				pendingReward.add(rewardPerBlock).mul(poolAllocPoint).div(totalAllocPoint),
				BigNumber.from(40)
			);
		});
	});

	describe("MigrateStrategy", function () {
		beforeEach("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});
		const allocPoint = 30;
		it("Should migrate strategy:", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);
			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});

			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);
			await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "grno"
			});

			const oldStrategyWantLocked = await this.strategy2.wantLockedTotal();
			const oldStrategySharesTotal = await this.strategy2.sharesTotal();

			await run("gymVaultsBank:migrateStrategy", {
				pid: "1",
				newStrategy: this.strategy3.address,
				caller: "deployer"
			});

			expect(await this.strategy3.wantLockedTotal()).to.equal(oldStrategyWantLocked);
			expect(await this.strategy3.sharesTotal()).to.equal(oldStrategySharesTotal);
			expect(await this.strategy2.wantLockedTotal()).to.equal(0);
			expect(await this.strategy2.sharesTotal()).to.equal(0);
		});

		it("Should revert with message: GymVaultsBank: New strategy not empty", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: "40",
				withUpdate: "false",
				strategy: this.strategy3.address,
				caller: "deployer"
			});
			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);
			await this.wantToken2.connect(accounts.grno).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});
			await run("gymVaultsBank:deposit", {
				pid: "2",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "grno"
			});
			await expect(
				run("gymVaultsBank:migrateStrategy", {
					pid: "1",
					newStrategy: this.strategy3.address,
					caller: "deployer"
				})
			).to.be.revertedWith("GymVaultsBank: New strategy not empty");
		});
	});
});
