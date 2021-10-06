const { expect } = require("chai");
const { advanceBlockTo, prepare, deploy, getBigNumber } = require("../utilities");
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
const variables = require("../../utils/constants/solpp")("fork");
const data = require("../../utils/constants/data/hardhat/GymFarming.json");

let accounts;
const amount = getBigNumber(4);
const poolAllocPoint2 = 50;

describe("GymFarming contract: ", function () {
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		await fixture();
		// await prepare(this, ["ERC20Mock"]);

		this.gymFarming = await getContract("GymFarming", accounts.deployer);
		this.gym = await getContract("GymToken", accounts.caller);
		this.provider = await getContractAt(
			"ILiquidityProvider",
			"0x2B1C93fFfF55E2620D6fb5DaD7D69A6a468C9731",
			accounts.caller
		);
		await this.gym.connect(accounts.holder).transfer(this.gymFarming.address, parseEther("1000000"));

		// this.tokenA = await getContract("TokenA", accounts.caller);
		// this.tokenB = await getContract("TokenB", accounts.caller);

		// await deploy(this, [
		// 	["testLp", this.ERC20Mock, ["LP Token", "LPT", getBigNumber(amount.mul(5))]],
		// 	["testLp1", this.ERC20Mock, ["LP Token1", "LPT", getBigNumber(amount.mul(5))]]
		// ]);

		// await this.testLp.transfer(accounts.caller.address, getBigNumber(amount));
		// await this.testLp.transfer(accounts.chugun.address, getBigNumber(amount));
		// await this.testLp.transfer(accounts.vzgo.address, getBigNumber(amount));
		// await this.testLp1.transfer(accounts.vzgo.address, getBigNumber(amount));
		// await this.testLp1.transfer(accounts.grno.address, getBigNumber(amount));

		this.startBlock = parseInt(await this.gymFarming.startBlock());
	});

	describe("SpeedStake function: ", function () {
		// only work when forked
		let router, factory, lpToken;
		before("Before: ", async function () {
			router = await getContractAt("IPancakeRouter02", "0x10ED43C718714eb63d5aA57B78B54704E256024E");
			factory = await getContractAt("IPancakeFactory", await router.factory());

			await this.gym.connect(accounts.holder).approve(router.address, parseEther("10"));

			await router
				.connect(accounts.holder)
				.addLiquidityETH(
					this.gym.address,
					parseEther("10"),
					0,
					0,
					accounts.holder.address,
					new Date().getTime() + 20,
					{
						value: parseEther("10")
					}
				);

			lpToken = await factory.getPair(this.gym.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
		});
		beforeEach("BeforeEach: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await this.gymFarming.add(poolAllocPoint2, lpToken, true);
		});

		afterEach("AfterEach: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should deposit in pool with BNB: ", async function () {
			await expect(() =>
				this.gymFarming.connect(accounts.holder).speedStake(0, 0, 0, 0, 0, new Date().getTime() + 20, {
					value: parseEther("10")
				})
			).to.changeTokenBalances(this.gym, [accounts.holder], [0]);

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount).to.not.equal(0);
		});

		it("Should deposit in pool: ", async function () {
			await this.gym.connect(accounts.holder).approve(this.gymFarming.address, parseEther("10"));
			await expect(() =>
				this.gymFarming
					.connect(accounts.holder)
					.speedStake(0, parseEther("10"), 0, 0, 0, new Date().getTime() + 20, {
						value: parseEther("10")
					})
			).to.changeTokenBalances(this.gym, [accounts.holder], [parseEther("10").mul(constants.NegativeOne)]);

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount).to.not.equal(0);
		});

		it("Should deposit in pool with token: ", async function () {
			await this.gym.connect(accounts.holder).approve(this.gymFarming.address, parseEther("10"));
			await expect(() =>
				this.gymFarming
					.connect(accounts.holder)
					.speedStake(0, parseEther("10"), 0, 0, 0, new Date().getTime() + 20)
			).to.changeTokenBalances(this.gym, [accounts.holder], [parseEther("10").mul(constants.NegativeOne)]);

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount).to.not.equal(0);
		});
	});

	describe("ClaimAndDeposit function: ", function () {
		// only work when forked
		let router, factory, lpToken;
		before("Before: ", async function () {
			router = await getContractAt("IPancakeRouter02", "0x10ED43C718714eb63d5aA57B78B54704E256024E");
			factory = await getContractAt("IPancakeFactory", await router.factory());

			await this.gym.connect(accounts.holder).approve(router.address, parseEther("10"));

			await router
				.connect(accounts.holder)
				.addLiquidityETH(
					this.gym.address,
					parseEther("10"),
					0,
					0,
					accounts.holder.address,
					new Date().getTime() + 20,
					{
						value: parseEther("10")
					}
				);

			lpToken = await factory.getPair(this.gym.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
		});
		beforeEach("BeforeEach: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await this.gymFarming.add(poolAllocPoint2, lpToken, true);
		});

		afterEach("AfterEach: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should claimA in pool: ", async function () {
			const tx = await this.gymFarming
				.connect(accounts.holder)
				.speedStake(0, 0, 0, 0, 0, new Date().getTime() + 20, {
					value: parseEther("10")
				});

			await advanceBlockTo(tx.blockNumber + 200);
			const userAmount = (await this.gymFarming.userInfo(0, accounts.holder.address)).amount;
			await this.gymFarming.connect(accounts.holder).claimAndDeposit(0, 0, 0, 0, new Date().getTime() + 20);

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount.sub(userAmount)).to.not.equal(0);
		});

		it("Should claimA in pool with additional BNB: ", async function () {
			const tx = await this.gymFarming
				.connect(accounts.holder)
				.speedStake(0, 0, 0, 0, 0, new Date().getTime() + 20, {
					value: parseEther("10")
				});

			await advanceBlockTo(tx.blockNumber + 200);
			const userAmount = (await this.gymFarming.userInfo(0, accounts.holder.address)).amount;
			await this.gymFarming.connect(accounts.holder).claimAndDeposit(0, 0, 0, 0, new Date().getTime() + 20, {
				value: parseEther("1")
			});

			expect((await this.gymFarming.userInfo(0, accounts.holder.address)).amount.sub(userAmount)).to.not.equal(0);
		});
	});
});
