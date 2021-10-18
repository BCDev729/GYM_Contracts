const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: {
		utils: { parseEther },
		getContract,
		getContractAt,
		getNamedSigners,
		constants
	}
} = require("hardhat");
const { advanceBlockTo } = require("../../utils/utilities/time");

describe("GymFarming contract: ", function () {
	let accounts, deployer, caller, holder;
	let gymFarming, gym, snapshotStart;
	const poolAllocPoint2 = 50;
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({ deployer, caller, holder } = accounts);
		await fixture("Fork");

		gymFarming = await getContract("GymFarming", deployer);
		gym = await getContract("GymToken", caller);
		await gym.connect(holder).transfer(gymFarming.address, parseEther("1000000"));
	});

	describe("SpeedStake function: ", function () {
		let router, factory, lpToken;
		before("Before: ", async function () {
			router = await getContractAt("IPancakeRouter02", "0x10ED43C718714eb63d5aA57B78B54704E256024E");
			factory = await getContractAt("IPancakeFactory", await router.factory());

			await gym.connect(holder).approve(router.address, parseEther("10"));

			await router
				.connect(holder)
				.addLiquidityETH(gym.address, parseEther("10"), 0, 0, holder.address, new Date().getTime() + 20, {
					value: parseEther("10")
				});

			lpToken = await factory.getPair(gym.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
		});
		beforeEach("BeforeEach: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await gymFarming.add(poolAllocPoint2, lpToken, true);
		});

		afterEach("AfterEach: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Should deposit in pool with BNB: ", async function () {
			await expect(() =>
				gymFarming.connect(holder).speedStake(0, 0, 0, 0, 0, new Date().getTime() + 20, {
					value: parseEther("10")
				})
			).to.changeTokenBalances(gym, [holder], [0]);

			expect((await gymFarming.userInfo(0, holder.address)).amount).to.not.equal(0);
		});

		it("Should deposit in pool: ", async function () {
			await gym.connect(holder).approve(gymFarming.address, parseEther("10"));
			await expect(() =>
				gymFarming.connect(holder).speedStake(0, parseEther("10"), 0, 0, 0, new Date().getTime() + 20, {
					value: parseEther("10")
				})
			).to.changeTokenBalances(gym, [holder], [parseEther("10").mul(constants.NegativeOne)]);

			expect((await gymFarming.userInfo(0, holder.address)).amount).to.not.equal(0);
		});

		it("Should deposit in pool with token: ", async function () {
			await gym.connect(holder).approve(gymFarming.address, parseEther("10"));
			await expect(() =>
				gymFarming.connect(holder).speedStake(0, parseEther("10"), 0, 0, 0, new Date().getTime() + 20)
			).to.changeTokenBalances(gym, [holder], [parseEther("10").mul(constants.NegativeOne)]);

			expect((await gymFarming.userInfo(0, holder.address)).amount).to.not.equal(0);
		});
	});

	describe("ClaimAndDeposit function: ", function () {
		let router, factory, lpToken;
		before("Before: ", async function () {
			router = await getContractAt("IPancakeRouter02", "0x10ED43C718714eb63d5aA57B78B54704E256024E");
			factory = await getContractAt("IPancakeFactory", await router.factory());

			await gym.connect(holder).approve(router.address, parseEther("10"));

			await router
				.connect(holder)
				.addLiquidityETH(gym.address, parseEther("10"), 0, 0, holder.address, new Date().getTime() + 20, {
					value: parseEther("10")
				});

			lpToken = await factory.getPair(gym.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
		});
		beforeEach("BeforeEach: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await gymFarming.add(poolAllocPoint2, lpToken, true);
		});

		afterEach("AfterEach: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Should claimA in pool: ", async function () {
			const tx = await gymFarming.connect(holder).speedStake(0, 0, 0, 0, 0, new Date().getTime() + 20, {
				value: parseEther("10")
			});

			await advanceBlockTo(tx.blockNumber + 200);
			const userAmount = (await gymFarming.userInfo(0, holder.address)).amount;
			await gymFarming.connect(holder).claimAndDeposit(0, 0, 0, 0, new Date().getTime() + 20);

			expect((await gymFarming.userInfo(0, holder.address)).amount.sub(userAmount)).to.not.equal(0);
		});

		it("Should claimA in pool with additional BNB: ", async function () {
			const tx = await gymFarming.connect(holder).speedStake(0, 0, 0, 0, 0, new Date().getTime() + 20, {
				value: parseEther("10")
			});

			await advanceBlockTo(tx.blockNumber + 200);
			const userAmount = (await gymFarming.userInfo(0, holder.address)).amount;
			await gymFarming.connect(holder).claimAndDeposit(0, 0, 0, 0, new Date().getTime() + 20, {
				value: parseEther("1")
			});

			expect((await gymFarming.userInfo(0, holder.address)).amount.sub(userAmount)).to.not.equal(0);
		});
	});
});
