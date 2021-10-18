const { expect } = require("chai");
const {
	deployments: { fixture, deploy },
	network,
	ethers: {
		constants,
		getNamedSigners,
		getContract,
		utils: { parseEther },
		BigNumber,
		provider: { getBlockNumber }
	},
	run,
	timeAndMine
} = require("hardhat");

const testVars = require("../../utils/constants/data/testVariables.json");
const variables = require("../../utils/constants/solpp")("hardhat");

describe("GymVaultsBank contract: ", function () {
	let accounts, deployer, owner, caller, holder, vzgo, grno;
	let wantToken1,
		wantToken2,
		gymToken,
		relationship,
		farming,
		buyBack,
		gymVaultsBank,
		WBNB,
		earnToken,
		strategy,
		strategy1,
		strategy2,
		strategy3,
		routerMock;
	let snapshotId, vzgoWant2Balance, grnoWant2Balance, grnoWant1Balance, rewardPerBlock;
	const rewardRate = parseEther("25.72864");
	const startBlock = 200;
	before("Before All: ", async function () {
		await fixture("Hardhat");
		accounts = await getNamedSigners();
		({ deployer, owner, caller, holder, vzgo, grno } = accounts);
		wantToken1 = await getContract("WantToken1", caller);
		wantToken2 = await getContract("WantToken2", caller);
		gymToken = await getContract("GymToken", caller);
		relationship = await getContract("GymMLM", caller);
		farming = await getContract("GymFarming", deployer);
		await farming.connect(deployer).add(30, gymToken.address, false);
		buyBack = await getContract("BuyBack", caller);
		gymVaultsBank = await getContract("GymVaultsBank", deployer);
		WBNB = await getContract("WBNBMock", caller);
		earnToken = await getContract("EarnToken", caller);
		strategy1 = await getContract("StrategyMock1", deployer);
		strategy2 = await getContract("StrategyMock2", deployer);
		strategy = await getContract("StrategyMock", caller);
		routerMock = await getContract("RouterMock", caller);

		await run("gymMLM:setBankAddress", {
			bankAddress: gymVaultsBank.address,
			caller: "deployer"
		});

		await run("gymVaultsBank:setFarmingAddress", {
			farmingAddress: farming.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:setTreasuryAddress", {
			treasuryAddress: owner.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:setWithdrawFee", {
			withdrawFee: "1000",
			caller: "deployer"
		});
		await WBNB.connect(deployer).deposit({
			value: parseEther("10")
		});
		await gymToken.connect(holder).transfer(gymVaultsBank.address, parseEther("10000"));
		await gymToken.connect(holder).delegate(buyBack.address);
		await WBNB.connect(deployer).transfer(routerMock.address, parseEther("10"));
		await deployer.sendTransaction({
			value: parseEther("5000"),
			to: routerMock.address
		});
		await gymToken.connect(holder).approve(routerMock.address, parseEther("1000"));
		await run("gymVaultsBank:add", {
			want: WBNB.address,
			allocPoint: "30",
			withUpdate: "false",
			strategy: strategy.address,
			caller: "deployer"
		});

		strategy3 = await getContract("StrategyMock3", deployer);

		await wantToken2.connect(deployer).transfer(vzgo.address, testVars.WANTTOKEN_AMOUNT / 4);
		await wantToken2.connect(deployer).transfer(grno.address, testVars.WANTTOKEN_AMOUNT / 4);
		await wantToken2.connect(deployer).transfer(routerMock.address, testVars.WANTTOKEN_AMOUNT / 4);

		await wantToken1.connect(deployer).transfer(grno.address, testVars.WANTTOKEN_AMOUNT / 2);
		await wantToken1.connect(deployer).transfer(vzgo.address, testVars.WANTTOKEN_AMOUNT / 2);
		await gymToken.connect(holder).transfer(gymVaultsBank.address, 2000);
		await gymToken.connect(holder).transfer(routerMock.address, parseEther(testVars.AMOUNT.toString()));
		await earnToken.connect(deployer).transfer(gymVaultsBank.address, 5000);
		await timeAndMine.mine(await getBlockNumber());
	});
	describe("Initialization: ", function () {
		beforeEach("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});

		it("Should initialize with correct parameters:", async function () {
			expect(await gymVaultsBank.RELATIONSHIP_REWARD()).to.equal(variables.GymVaultsBank_RELATIONSHIP_REWARD);
			expect(await gymVaultsBank.VAULTS_SAVING()).to.equal(variables.GymVaultsBank_VAULTS_SAVING);
			expect(await gymVaultsBank.BUY_AND_BURN_GYM()).to.equal(variables.GymVaultsBank_BUY_AND_BURN);
			expect(await gymVaultsBank.startBlock()).to.equal(startBlock);
			expect(await gymVaultsBank.rewardPoolInfo()).to.deep.equal([gymToken.address, BigNumber.from(rewardRate)]);
		});

		it("Should revert:GymVaultsBank: Start block must have a bigger value", async function () {
			const startBlock = await getBlockNumber();
			await timeAndMine.mine(10);

			await expect(
				deploy("GymVaultsBank", {
					from: deployer.address,
					args: [startBlock, gymToken.address, rewardRate],
					log: true,
					deterministicDeployment: false
				})
			).to.be.revertedWith("GymVaultsBank: Start block must have a bigger value");
		});
	});

	describe("Reward Pool functions: ", function () {
		beforeEach("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});

		it("Should update RewardPerBlock", async function () {
			const rewardPerBlock = (await gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
			await timeAndMine.mine((await gymVaultsBank.startBlock()) + 15 - (await getBlockNumber()));

			expect((await gymVaultsBank.rewardPoolInfo()).rewardPerBlock).to.equal(rewardPerBlock);

			await timeAndMine.mine((await gymVaultsBank.startBlock()) + 20 - (await getBlockNumber()));

			await run("gymVaultsBank:updateRewardPerBlock", {
				caller: "deployer"
			});

			expect(Math.floor(BigNumber.from((await gymVaultsBank.rewardPoolInfo()).rewardPerBlock))).to.equal(
				Math.floor((rewardPerBlock * variables.GymVaultsBank_COEFFICIENT) / 1e12)
			);

			await timeAndMine.mine((await gymVaultsBank.startBlock()) + 41 - (await getBlockNumber()));

			await run("gymVaultsBank:updateRewardPerBlock", {
				caller: "deployer"
			});

			expect(Math.floor(BigNumber.from((await gymVaultsBank.rewardPoolInfo()).rewardPerBlock))).to.equal(
				Math.floor((rewardPerBlock * variables.GymVaultsBank_COEFFICIENT ** 2) / 1e12 ** 2)
			);

			await timeAndMine.mine((await gymVaultsBank.startBlock()) + 62 - (await getBlockNumber()));

			await run("gymVaultsBank:updateRewardPerBlock", {
				caller: "deployer"
			});

			expect(Math.floor(BigNumber.from((await gymVaultsBank.rewardPoolInfo()).rewardPerBlock))).to.equal(
				Math.floor((rewardPerBlock * variables.GymVaultsBank_COEFFICIENT ** 3) / 1e12 ** 3)
			);

			await timeAndMine.mine((await gymVaultsBank.startBlock()) + 90 - (await getBlockNumber()));

			await run("gymVaultsBank:updateRewardPerBlock", {
				caller: "deployer"
			});

			expect(Math.floor(BigNumber.from((await gymVaultsBank.rewardPoolInfo()).rewardPerBlock))).to.equal(
				Math.floor((rewardPerBlock * variables.GymVaultsBank_COEFFICIENT ** 3) / 1e12 ** 3)
			);
		});
	});

	describe("Add function: ", function () {
		const allocPoint = 20;
		const corePoolAllocPoint = 30;
		let poolLength;

		beforeEach("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});
		it("Should add Pool:", async function () {
			poolLength = await gymVaultsBank.poolLength();
			await timeAndMine.mine(200);

			const tx = await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy1.address,
				caller: "deployer"
			});
			poolLength = poolLength.add(1);

			expect(await gymVaultsBank.poolLength()).to.equal(poolLength);
			expect(await gymVaultsBank.poolInfo(poolLength.sub(1))).to.deep.equal([
				wantToken2.address,
				BigNumber.from(20),
				BigNumber.from(tx.blockNumber),
				BigNumber.from(0),
				strategy1.address
			]);
			expect(await gymVaultsBank.totalAllocPoint()).to.equal(allocPoint + corePoolAllocPoint);
		});

		it("Should set new allocation point:", async function () {
			await timeAndMine.mine(150);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy1.address,
				caller: "deployer"
			});
			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();
			const poolAllocPoint = (await gymVaultsBank.poolInfo(poolLength.sub(1))).allocPoint;
			const newAllocPoint = BigNumber.from(30);

			await run("gymVaultsBank:set", {
				pid: `${poolLength.sub(1)}`,
				allocPoint: `${newAllocPoint}`,
				caller: "deployer"
			});
			expect(await gymVaultsBank.totalAllocPoint()).to.equal(
				totalAllocPoint.sub(poolAllocPoint).add(newAllocPoint)
			);
			expect((await gymVaultsBank.poolInfo(poolLength.sub(1))).allocPoint).to.equal(newAllocPoint);
		});

		it("Should: Reset Strategy", async function () {
			await timeAndMine.mine(150);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy1.address,
				caller: "deployer"
			});

			await run("gymVaultsBank:resetStrategy", {
				pid: "1",
				strategy: strategy2.address,
				caller: "deployer"
			});
			expect((await gymVaultsBank.poolInfo(1)).strategy).to.equal(strategy2.address);

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);
			await wantToken2.connect(grno).approve(gymVaultsBank.address, testVars.AMOUNT);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "grno"
			});
			await expect(
				run("gymVaultsBank:resetStrategy", {
					pid: "1",
					strategy: strategy3.address,
					caller: "deployer"
				})
			).to.be.revertedWith("GymVaultsBank: Strategy not empty");
		});
	});

	describe("Deposit, Pending", function () {
		before(async function () {
			vzgoWant2Balance = await wantToken2.balanceOf(vzgo.address);
			grnoWant2Balance = await wantToken2.balanceOf(grno.address);
			grnoWant1Balance = await wantToken1.balanceOf(grno.address);
			rewardPerBlock = (await gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
		});

		beforeEach("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});
		const allocPoint = 30;

		it("Should emit Deposit event with correct args", async function () {
			const startBlock = await getBlockNumber();
			await timeAndMine.mine((await getBlockNumber()) + startBlock);
			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);
			const wantAmt = (testVars.AMOUNT * 45) / 100;
			await expect(run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			}))
				.to
				.emit(gymVaultsBank, "Deposit")
				.withArgs(accounts.vzgo.address, 1, wantAmt);
			await timeAndMine.mine((await getBlockNumber()) + testVars.BLOCK_COUNT);
		});

		it("Should add deposit from vzgo, return correct stakedWantTokens count:", async function () {
			await timeAndMine.mine(startBlock);
			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});

			const poolAllocPoint1 = (await gymVaultsBank.poolInfo(1)).allocPoint;

			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});


			expect(await wantToken2.balanceOf(vzgo.address)).to.equal(vzgoWant2Balance.sub(testVars.AMOUNT));
			// const depositTime = (await ethers.provider.getBlock(tx.blockNumber)).timestamp;
			// expect((await gymVaultsBank.userInfo(1, vzgo.address)).shares).to.equal(testVars.AMOUNT * variables["GymVaultsBank_VAULTS_SAVING"] / 100)

			await timeAndMine.mine(testVars.BLOCK_COUNT);

			expect(
				await run("gymVaultsBank:stakedWantTokens", {
					pid: "1",
					user: vzgo.address
				})
			).to.equal((testVars.AMOUNT * variables.GymVaultsBank_VAULTS_SAVING) / 100);
			expect(
				BigNumber.from(
					await run("gymVaultsBank:pendingReward", {
						pid: "1",
						user: vzgo.address
					})
				).add(1)
			).to.equal(rewardPerBlock.mul(testVars.BLOCK_COUNT).mul(poolAllocPoint1).div(totalAllocPoint));
		});

		it("Should calculate rewards for 2 users in 1 pool:", async function () {
			await timeAndMine.mine(startBlock);
			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await gymVaultsBank.poolInfo(1)).allocPoint;

			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);
			await wantToken2.connect(grno).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "grno"
			});

			expect(await wantToken2.balanceOf(vzgo.address)).to.equal(vzgoWant2Balance - testVars.AMOUNT);
			expect(await wantToken2.balanceOf(grno.address)).to.equal(grnoWant2Balance - testVars.AMOUNT);

			await timeAndMine.mine(testVars.BLOCK_COUNT);

			expect(
				BigNumber.from(
					await run("gymVaultsBank:pendingReward", {
						pid: "1",
						user: vzgo.address
					})
				).add(1)
			).to.equal(
				rewardPerBlock
					.mul(testVars.BLOCK_COUNT)
					.mul(poolAllocPoint1)
					.div(totalAllocPoint)
					.add(rewardPerBlock)
					.mul(poolAllocPoint1)
					.div(totalAllocPoint)
			);
			expect(
				await run("gymVaultsBank:pendingReward", {
					pid: "1",
					user: grno.address
				})
			).to.equal(rewardPerBlock.div(2).mul(testVars.BLOCK_COUNT).mul(poolAllocPoint1).div(totalAllocPoint));
		});

		it("Should calculate rewards for 2 users in 2 different pools:", async function () {
			await timeAndMine.mine(startBlock);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});

			await run("gymVaultsBank:add", {
				want: wantToken1.address,
				allocPoint: "40",
				withUpdate: "false",
				strategy: strategy1.address,
				caller: "deployer"
			});

			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();
			const poolAllocPoint2 = (await gymVaultsBank.poolInfo(2)).allocPoint;

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);
			await wantToken1.connect(grno).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});
			await run("gymVaultsBank:deposit", {
				pid: "2",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "grno"
			});

			expect(await wantToken2.balanceOf(vzgo.address)).to.equal(vzgoWant2Balance - testVars.AMOUNT);
			expect(await wantToken1.balanceOf(grno.address)).to.equal(grnoWant1Balance - testVars.AMOUNT);

			await timeAndMine.mine(testVars.BLOCK_COUNT);
			// const currentBlock = await getBlockNumber();
			// expect(await gymVaultsBank.pendingReward(1, vzgo.address))
			//     .to.equal((ethers.BigNumber.from(currentBlock).sub(vzgoDeposit.blockNumber)).mul(rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint))
			expect(
				(
					await run("gymVaultsBank:pendingReward", {
						pid: "2",
						user: grno.address
					})
				).add(1)
			).to.equal(rewardPerBlock.mul(testVars.BLOCK_COUNT).mul(poolAllocPoint2).div(totalAllocPoint));
		});
	});

	describe("depositBNB", function () {
		before("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});
		it("Should deposit BNB", async function () {
			const vzgoBalance = await vzgo.getBalance();
			const allocPoint = 30;
			await timeAndMine.mine(startBlock);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});

			const tx = await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: `${parseEther(testVars.AMOUNT.toString())}`
			});

			const fee = (await tx.wait()).gasUsed * tx.gasPrice;
			const finalBalance = vzgoBalance - parseEther(testVars.AMOUNT.toString()) - fee;
			expect(Number(await vzgo.getBalance())).to.be.closeTo(
				Number(finalBalance),
				Number(parseEther("0.00000005"))
			);
			expect(Number((await gymVaultsBank.userInfo(0, vzgo.address)).shares)).to.equal(
				(variables.GymVaultsBank_VAULTS_SAVING / 100) * Number(parseEther(testVars.AMOUNT.toString()))
			);
		});
	});

	describe("Claim function: ", function () {
		beforeEach("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});

		it("Should emit RewardPaid event with correct args", async function () {
			const rewardPerBlock = (await gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
			const startBlock = await getBlockNumber();
			await timeAndMine.mine((await getBlockNumber()) + startBlock);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: "30",
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await gymVaultsBank.poolInfo(1)).allocPoint;
			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();
			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});
			await timeAndMine.mine((await getBlockNumber()) + 100);

			const pending = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: vzgo.address
			});
			await expect(run("gymVaultsBank:claim", {
				pid: "1",
				caller: "vzgo"
			}))
				.to
				.emit(gymVaultsBank, "RewardPaid")
				.withArgs(
					gymToken.address,
					vzgo.address,
					pending.add(rewardPerBlock.mul(poolAllocPoint1).div(totalAllocPoint)
					));

		});

		it("Should claim rewards", async function () {
			const rewardPerBlock = (await gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
			await timeAndMine.mine(startBlock);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: "30",
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await gymVaultsBank.poolInfo(1)).allocPoint;
			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();
			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);

			await expect(async () =>
				await run("gymVaultsBank:deposit", {
					pid: "1",
					wantAmt: testVars.AMOUNT.toString(),
					referrerId: (await relationship.addressToId(deployer.address)).toString(),
					caller: "vzgo"
				})

			)
				.to
				.changeTokenBalance(wantToken2, vzgo, -1 * testVars.AMOUNT);

			await timeAndMine.mine(150);

			const pending = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: vzgo.address
			});

			await run("gymVaultsBank:claim", {
				pid: "1",
				caller: "vzgo"
			});

			expect(await gymToken.balanceOf(vzgo.address)).to.equal(
				pending.add(rewardPerBlock.mul(poolAllocPoint1).div(totalAllocPoint))
			);
		});

		it("Should claimAll rewards", async function () {
			const rewardPerBlock = (await gymVaultsBank.rewardPoolInfo()).rewardPerBlock;

			await timeAndMine.mine(startBlock);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: "30",
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});

			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: `${parseEther(testVars.AMOUNT.toString())}`
			});

			await timeAndMine.mine(150);

			const pending0 = await run("gymVaultsBank:pendingReward", {
				pid: "0",
				user: vzgo.address
			});
			const pending1 = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: vzgo.address
			});

			await run("gymVaultsBank:claimAll", {
				caller: "vzgo"
			});

			expect(Math.floor(await gymToken.balanceOf(vzgo.address))).to.equal(
				Math.floor(pending0.add(pending1).add(rewardPerBlock))
			);
		});
	});

	describe("Withdraw", function () {
		before(async function () {
			vzgoWant2Balance = await wantToken2.balanceOf(vzgo.address);
			grnoWant2Balance = await wantToken2.balanceOf(grno.address);
			grnoWant1Balance = await wantToken1.balanceOf(grno.address);
			rewardPerBlock = (await gymVaultsBank.rewardPoolInfo()).rewardPerBlock;
		});
		beforeEach("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});
		const allocPoint = 30;

		it("Should emit Withdraw event with correct args", async function () {
			const startBlock = await getBlockNumber();
			await timeAndMine.mine((await getBlockNumber()) + startBlock);
			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});

			const vzgoShares = (await gymVaultsBank.userInfo(1, vzgo.address)).shares;

			await timeAndMine.mine((await getBlockNumber()) + testVars.BLOCK_COUNT);
			const wantAmt = (testVars.AMOUNT * 45) / 100;

			await expect(run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${vzgoShares}`,
				caller: "vzgo"
			}))
				.to
				.emit(gymVaultsBank, "Withdraw")
				.withArgs(accounts.vzgo.address, 1, wantAmt);
		});

		it("Should transfer all assets to Vzgo(single user):", async function () {
			await timeAndMine.mine(startBlock);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await gymVaultsBank.poolInfo(1)).allocPoint;
			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, (25000).toString());

			const _referrerId = await relationship.addressToId(deployer.address);


			await expect(() =>
				run("gymVaultsBank:deposit", {
					pid: "1",
					wantAmt: `${25000}`,
					referrerId: _referrerId.toString(),
					caller: "vzgo"
				})
			)
				.to
				.changeTokenBalance(wantToken2, vzgo, -1 * 25000);

			const vzgoShares = (await gymVaultsBank.userInfo(1, vzgo.address)).shares;

			await timeAndMine.mine(testVars.BLOCK_COUNT);

			const pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: vzgo.address
			});

			const withdrawFee = await gymVaultsBank.withdrawFee();
			console.log("withdraw", withdrawFee.toString());

			const vzgoSharesWithoutFee = Math.round(vzgoShares - vzgoShares * withdrawFee / 10000);
			await expect(() =>
				run("gymVaultsBank:withdraw", {
					pid: "1",
					wantAmt: `${vzgoShares}`,
					caller: "vzgo"
				})
			)
				.to
				.changeTokenBalance(wantToken2, vzgo, vzgoSharesWithoutFee);


			expect((await wantToken2.balanceOf(vzgo.address))).to.equal(
				vzgoWant2Balance -
				(25000 *
					(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
				100 -
				vzgoShares / 10
			);
			expect(BigNumber.from(await gymToken.balanceOf(vzgo.address))).to.equal(
				BigNumber.from(rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
			);
		});
		it("Should transfer part of  assets to Vzgo(single user):", async function () {
			await timeAndMine.mine(startBlock);
			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await gymVaultsBank.poolInfo(1)).allocPoint;
			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});


			const vzgoShares = (await gymVaultsBank.userInfo(1, vzgo.address)).shares;

			await timeAndMine.mine(testVars.BLOCK_COUNT);

			const pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: vzgo.address
			});

			await run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${vzgoShares - 20}`,
				caller: "vzgo"
			});

			expect((await wantToken2.balanceOf(vzgo.address)).sub(1)).to.equal(
				Math.floor(
					vzgoWant2Balance -
					20 -
					(testVars.AMOUNT *
						(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
					100 -
					(vzgoShares - 20) / 10
				)
			);
			expect(BigNumber.from(await gymToken.balanceOf(vzgo.address))).to.equal(
				BigNumber.from(rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
			);
		});
		it("Should withdraw all assets (2 users in 1 pool):", async function () {
			await timeAndMine.mine(startBlock);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});
			const poolAllocPoint1 = (await gymVaultsBank.poolInfo(1)).allocPoint;

			await run("gymVaultsBank:add", {
				want: wantToken1.address,
				allocPoint: "40",
				withUpdate: "false",
				strategy: strategy1.address,
				caller: "deployer"
			});
			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);
			await wantToken2.connect(grno).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "grno"
			});

			const vzgoShares = (await gymVaultsBank.userInfo(1, vzgo.address)).shares;
			const grnoShares = (await gymVaultsBank.userInfo(1, grno.address)).shares;

			await timeAndMine.mine(testVars.BLOCK_COUNT);

			let pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: vzgo.address
			});
			await run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${testVars.AMOUNT}`,
				caller: "vzgo"
			});

			expect((await wantToken2.balanceOf(vzgo.address)).sub(1)).to.equal(
				Math.floor(
					vzgoWant2Balance -
					(testVars.AMOUNT *
						(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
					100 -
					vzgoShares / 10
				)
			);
			expect(BigNumber.from(await gymToken.balanceOf(vzgo.address))).to.equal(
				BigNumber.from(rewardPerBlock.div(2).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward))
			);

			await timeAndMine.mine(testVars.BLOCK_COUNT);

			pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "1",
				user: grno.address
			});

			await run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${testVars.AMOUNT}`,
				caller: "grno"
			});

			expect((await wantToken2.balanceOf(grno.address)).sub(1)).to.equal(
				Math.floor(
					grnoWant2Balance -
					(testVars.AMOUNT *
						(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
					100 -
					grnoShares / 10
				)
			);
			expect(BigNumber.from(await gymToken.balanceOf(grno.address))).to.equal(
				BigNumber.from(rewardPerBlock).mul(poolAllocPoint1).div(totalAllocPoint).add(pendingReward)
			);
		});
		it("Should transfer all assets(more than balance) safeTransfer check:", async function () {
			await timeAndMine.mine(startBlock);
			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});

			const bankGymBalance = await gymToken.balanceOf(gymVaultsBank.address);

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});

			const vzgoShares = (await gymVaultsBank.userInfo(1, vzgo.address)).shares;

			await timeAndMine.mine(1000);

			await run("gymVaultsBank:withdraw", {
				pid: "1",
				wantAmt: `${testVars.AMOUNT}`,
				caller: "vzgo"
			});

			expect(await wantToken2.balanceOf(vzgo.address)).to.equal(
				vzgoWant2Balance
					.sub(
						(testVars.AMOUNT *
							(variables.GymVaultsBank_BUY_AND_BURN + variables.GymVaultsBank_RELATIONSHIP_REWARD)) /
						100
					)
					.sub(vzgoShares.div(10))
			);
			expect(await gymToken.balanceOf(vzgo.address)).to.equal(bankGymBalance);
		});
	});

	describe("WithdrawBNB", function () {
		beforeEach("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});

		it("Should correct transfer bnb when call deposit and withdraw functions", async function () {
			const snapshot1 = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
			await timeAndMine.mine(startBlock);

			const depositTx = await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: `${parseEther(testVars.AMOUNT.toString())}`
			});

			await timeAndMine.mine(testVars.BLOCK_COUNT);

			const withdrawTx = await run("gymVaultsBank:withdraw", {
				pid: "0",
				wantAmt: `${parseEther(testVars.AMOUNT.toString())}`,
				caller: "vzgo"
			});

			const fee =
				(await depositTx.wait()).gasUsed * depositTx.gasPrice +
				(await withdrawTx.wait()).gasUsed * withdrawTx.gasPrice;

			await network.provider.request({
				method: "evm_revert",
				params: [snapshot1]
			});


			await timeAndMine.mine(startBlock);

			const vzgoBalance = (await vzgo.getBalance()).toString();

			const referrerId = (await relationship.addressToId(deployer.address)).toString();

			await expect(async () =>
				await run("gymVaultsBank:deposit", {
					pid: "0",
					wantAmt: "0",
					referrerId: referrerId,
					caller: "vzgo",
					bnbAmount: `${parseEther(testVars.AMOUNT.toString())}`
				})
			)
				.to
				.changeEtherBalance(vzgo, (parseEther(testVars.AMOUNT.toString())).mul(constants.NegativeOne));

			const vzgoBalanceAfterDep = (await vzgo.getBalance()).toString();

			const vzgoShares = (await gymVaultsBank.userInfo(0, vzgo.address)).shares;

			const procents = BigNumber.from(vzgoBalance)
				.sub(
					BigNumber.from(parseEther(testVars.AMOUNT.toString()))
						.mul(
							BigNumber.from(variables.GymVaultsBank_BUY_AND_BURN).add(
								variables.GymVaultsBank_RELATIONSHIP_REWARD
							)
						)
						.div(100)
				)
				.sub(BigNumber.from(vzgoShares).div(10));

			const balanceWithoutProcents = BigNumber.from(vzgoBalanceAfterDep).sub(procents);

			let balanceAfterWithdraw = balanceWithoutProcents.sub(fee).mul(constants.NegativeOne);
			balanceAfterWithdraw = balanceAfterWithdraw.toString();
			balanceAfterWithdraw = parseInt(balanceAfterWithdraw);

			await timeAndMine.mine(testVars.BLOCK_COUNT);

			balanceAfterWithdraw = balanceAfterWithdraw / 1e17;
			balanceAfterWithdraw = Math.floor(balanceAfterWithdraw);
			balanceAfterWithdraw = balanceAfterWithdraw * 1e17;

			// if()

			await expect(async () =>
				await run("gymVaultsBank:withdraw", {
					pid: "0",
					wantAmt: `${parseEther(testVars.AMOUNT.toString())}`,
					caller: "vzgo"
				})
			)
				.to
				.changeEtherBalance(vzgo, BigNumber.from(balanceAfterWithdraw.toString()));
		});

		it("Should withdraw all shared amount and return BNB", async function () {
			await timeAndMine.mine(startBlock);
			const poolAllocPoint = (await gymVaultsBank.poolInfo(0)).allocPoint;
			const totalAllocPoint = await gymVaultsBank.totalAllocPoint();
			const rewardPerBlock = (await gymVaultsBank.rewardPoolInfo()).rewardPerBlock;

			const vzgoBalance = (await vzgo.getBalance()).toString();

			const depositTx = await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: `${parseEther(testVars.AMOUNT.toString())}`
			});
			const vzgoShares = (await gymVaultsBank.userInfo(0, vzgo.address)).shares;

			await timeAndMine.mine(testVars.BLOCK_COUNT);

			const pendingReward = await run("gymVaultsBank:pendingReward", {
				pid: "0",
				user: vzgo.address
			});

			const withdrawTx = await run("gymVaultsBank:withdraw", {
				pid: "0",
				wantAmt: `${parseEther(testVars.AMOUNT.toString())}`,
				caller: "vzgo"
			});

			const fee =
				(await depositTx.wait()).gasUsed * depositTx.gasPrice +
				(await withdrawTx.wait()).gasUsed * withdrawTx.gasPrice;

			expect(BigNumber.from(await vzgo.getBalance())).to.be.closeTo(
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
			
			console.log(`fee is: ${fee}`);

			expect(await gymToken.balanceOf(vzgo.address)).to.be.closeTo(
				pendingReward.add(rewardPerBlock).mul(poolAllocPoint).div(totalAllocPoint),
				BigNumber.from(40)
			);
		});
	});

	describe("MigrateStrategy", function () {
		beforeEach("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});
		const allocPoint = 30;
		it("Should migrate strategy:", async function () {
			await timeAndMine.mine(startBlock);
			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});

			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);
			await wantToken2.connect(grno).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "grno"
			});

			const oldStrategyWantLocked = await strategy2.wantLockedTotal();
			const oldStrategySharesTotal = await strategy2.sharesTotal();

			await run("gymVaultsBank:migrateStrategy", {
				pid: "1",
				newStrategy: strategy3.address,
				caller: "deployer"
			});

			expect(await strategy3.wantLockedTotal()).to.equal(oldStrategyWantLocked);
			expect(await strategy3.sharesTotal()).to.equal(oldStrategySharesTotal);
			expect(await strategy2.wantLockedTotal()).to.equal(0);
			expect(await strategy2.sharesTotal()).to.equal(0);
		});

		it("Should revert with message: GymVaultsBank: New strategy not empty", async function () {
			await timeAndMine.mine(startBlock);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: `${allocPoint}`,
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: "40",
				withUpdate: "false",
				strategy: strategy3.address,
				caller: "deployer"
			});
			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);
			await wantToken2.connect(grno).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});
			await run("gymVaultsBank:deposit", {
				pid: "2",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "grno"
			});
			await expect(
				run("gymVaultsBank:migrateStrategy", {
					pid: "1",
					newStrategy: strategy3.address,
					caller: "deployer"
				})
			).to.be.revertedWith("GymVaultsBank: New strategy not empty");
		});
	});
});
