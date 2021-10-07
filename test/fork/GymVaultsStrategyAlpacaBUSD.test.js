
const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: {
		getNamedSigners,
		getContract,
		getContractAt,
		getSigner,
		utils: { parseEther },
	},
	ethers
} = require("hardhat");

const { advanceBlockTo } = require("../utilities/time");
const variables = require("../../utils/constants/solpp")("fork");
const farmingData = require("../../utils/constants/data/fork/GymFarming.json");

let accounts;


describe("GymVaultsStrategyAlpacaBUSD contract: ", function () {
	// only working when forked
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		await fixture();

		// this.wantToken1 = await getContract("WantToken1", accounts.caller);
		// this.wantToken2 = await getContract("WantToken2", accounts.caller);
		this.gymToken = await getContract("GymToken", accounts.caller);
		this.relationship = await getContract("GymMLM", accounts.deployer);
		this.farming = await getContract("GymFarming", accounts.deployer);
		await this.farming.connect(accounts.deployer).add(30, this.gymToken.address, false);
		this.buyBack = await getContract("BuyBack", accounts.caller);
		this.gymVaultsBank = await getContract("GymVaultsBank", accounts.deployer);
		// this.WBNB = await getContract("WBNBMock", accounts.caller);
		// this.earnToken = await getContract("EarnToken", accounts.caller);
		// this.strategy1 = await getContract("StrategyMock1", accounts.deployer);
		// this.strategy2 = await getContract("StrategyMock2", accounts.deployer);
		// this.strategy = await getContract("StrategyMock", accounts.caller);
		// this.routerMock = await getContract("RouterMock", accounts.caller);

		this.router = await getContractAt("IPancakeRouter02", variables.ROUTER);
		this.factory = await getContractAt("IPancakeFactory", await this.router.factory());
		this.vault = await getContractAt("IVault", variables.FAIR_LAUNCH_VAULT);
		this.fairLaunch = await getContractAt("IFairLaunch", variables.ALPACA_FAIR_LAUNCH);
		this.busd = await getContractAt("GymToken", variables.BUSD);
		this.alpaca = await getContractAt("GymToken", variables.ALPACA_TOKEN);
		this.ibToken = await getContractAt("GymToken", "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f");
		this.strategyAlpaca = await getContract("GymVaultsStrategyAlpaca", accounts.caller);
		await this.relationship.setBankAddress(this.gymVaultsBank.address);
		await this.gymVaultsBank.connect(accounts.deployer).setTreasuryAddress(accounts.owner.address);
		await this.gymVaultsBank.connect(accounts.deployer).setFarmingAddress(this.farming.address);
		await this.gymVaultsBank.connect(accounts.deployer).setWithdrawFee(1000);
		await this.gymToken.connect(accounts.holder).delegate(this.buyBack.address);
		await network.provider.request({
			method: "hardhat_impersonateAccount",
			params: ["0xf9211FfBD6f741771393205c1c3F6D7d28B90F03"]
		});

		const signer = await getSigner("0xf9211FfBD6f741771393205c1c3F6D7d28B90F03");

		await this.busd.connect(signer).transfer(accounts.holder.address, await this.busd.balanceOf(signer.address));

		await network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: ["0xf9211FfBD6f741771393205c1c3F6D7d28B90F03"]
		});

		await this.gymToken.connect(accounts.holder).approve(this.router.address, parseEther("1000"));

		await this.router
			.connect(accounts.holder)
			.addLiquidityETH(
				this.gymToken.address,
				parseEther("1000"),
				0,
				0,
				this.farming.address,
				new Date().getTime() + 20,
				{
					value: parseEther("100")
				}
			);

		this.lpGymBnb = await this.factory.getPair(this.gymToken.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");

		await this.gymVaultsBank.connect(accounts.deployer).add(this.busd.address, 30, false, this.strategyAlpaca.address);
		await this.gymVaultsBank.connect(accounts.deployer).add(this.busd.address, 30, false, this.strategyAlpaca.address);
		await this.farming.connect(accounts.deployer).add(30, this.lpGymBnb, false);

		await this.busd.connect(accounts.holder).transfer(this.gymVaultsBank.address, parseEther("1000"));
		await this.busd.connect(accounts.holder).transfer(this.farming.address, parseEther("1000"));
		await this.gymToken.connect(accounts.holder).transfer(this.gymVaultsBank.address, parseEther("1000"));
		await this.gymToken.connect(accounts.holder).transfer(this.router.address, parseEther("1000"));

		await this.gymToken.connect(accounts.holder).approve(this.router.address, parseEther("2000"));
		await this.busd.connect(accounts.holder).approve(this.router.address, parseEther("1000"));

		await this.router
			.connect(accounts.holder)
			.addLiquidity(
				this.gymToken.address,
				this.busd.address,
				parseEther("1000"),
				parseEther("1000"),
				0,
				0,
				accounts.holder.address,
				new Date().getTime() + 20,
				{
					gasLimit: 5000000
				}
			);
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

		it("Should accept deposit from user: ", async function () {
			await this.busd.connect(accounts.holder).approve(this.gymVaultsBank.address, ethers.utils.parseEther("100"));

			await this.gymVaultsBank
				.connect(accounts.holder)
				.deposit(1, ethers.utils.parseEther("100"), 1, 0, new Date().getTime() + 20);
			expect(await this.strategyAlpaca.wantLockedTotal()).to.equal(ethers.utils.parseEther("45"));
			expect(await this.strategyAlpaca.sharesTotal()).to.equal(ethers.utils.parseEther("45"));
		});
	});

	describe("Claim function: ", function () {
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

		it("Should accept claim from user: ", async function () {
			await this.busd.connect(accounts.holder).approve(this.gymVaultsBank.address, ethers.utils.parseEther("0.1"));

			const tx = await this.gymVaultsBank
				.connect(accounts.holder)
				.deposit(1, ethers.utils.parseEther("0.1"), 1, 0, new Date().getTime() + 20);

			await advanceBlockTo(tx.blockNumber + 100);

			const pending = await this.gymVaultsBank.pendingReward(1, accounts.holder.address);

			await expect(() => this.gymVaultsBank.connect(accounts.holder).claim(1)).to.changeTokenBalances(
				this.gymToken,
				[accounts.holder, this.gymVaultsBank],
				[
					pending.add(farmingData.rewardPerBlock.div(2)),
					pending.add(farmingData.rewardPerBlock.div(2)).mul(ethers.constants.NegativeOne)
				]
			);
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

		it("Should accept withdraw from user: ", async function () {
			await this.busd.connect(accounts.holder).approve(this.gymVaultsBank.address, ethers.utils.parseEther("0.1"));

			const tx = await this.gymVaultsBank
				.connect(accounts.holder)
				.deposit(1, ethers.utils.parseEther("0.1"), 1, 0, new Date().getTime() + 20);

			await advanceBlockTo(tx.blockNumber + 100);

			await expect(() =>
				this.gymVaultsBank.connect(accounts.holder).withdraw(1, ethers.utils.parseEther("0.04"))
			).to.changeTokenBalances(this.busd, [accounts.holder], [ethers.utils.parseEther("0.036")]);
		});
	});

	describe("ClaimAndDeposit function: ", function () {
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

		it("Should accept claimAndDeposit from user: ", async function () {
			await this.busd.connect(accounts.holder).approve(this.gymVaultsBank.address, ethers.utils.parseEther("0.1"));

			const tx = await this.gymVaultsBank
				.connect(accounts.holder)
				.deposit(1, ethers.utils.parseEther("0.1"), 1, 0, new Date().getTime() + 20);

			await advanceBlockTo(tx.blockNumber + 100);

			await this.gymVaultsBank.connect(accounts.holder).claimAndDeposit(1, 0, 0, 0, new Date().getTime() + 20);
			expect((await this.farming.userInfo(0, accounts.holder.address)).amount).to.not.equal(0);
		});
	});
});
