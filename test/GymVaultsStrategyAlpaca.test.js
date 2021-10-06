const { expect } = require("chai");
const {
	deployments: { fixture, deploy },
	network,
	ethers
} = require("hardhat");
const { getContract, getNamedSigners } = ethers;
const testVars = require("./utilities/testVariables.json");

let accounts;

describe("GymVaultsStrategyAlpaca contract: ", function () {
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		await fixture();

		this.router = await getContract("RouterMock");
		this.farm = await getContract("FarmMock");
		this.vault = await getContract("VaultMock");
		this.fairLaunch = await getContract("FairLaunchMock");
		this.bank = await getContract("BankMock", accounts.caller);
		this.gymToken = await getContract("GymToken", accounts.caller);
		this.want = await getContract("WantToken1", accounts.caller);
		this.earn = await getContract("EarnToken", accounts.caller);
		this.tokenA = await getContract("TokenA", accounts.caller);
		this.ibToken = await getContract("ibToken", accounts.caller);

		this.strategyAlpaca = await getContract("GymVaultsStrategyAlpaca", accounts.caller);

		await deploy("GymVaultsStrategyAlpaca", {
			from: accounts.deployer.address,
			args: [
				this.bank.address,
				true,
				this.vault.address,
				this.fairLaunch.address,
				0, // pid
				this.want.address,
				this.earn.address,
				this.router.address
			],
			log: true,
			deterministicDeployment: false
		});

		this.strategyAlpacaAutoComp = await getContract("GymVaultsStrategyAlpaca", accounts.caller);

		await this.want.connect(accounts.deployer).transfer(this.bank.address, testVars.TOKENS_MINT_AMOUNT / 4);
		await this.want.connect(accounts.deployer).transfer(this.router.address, testVars.TOKENS_MINT_AMOUNT / 4);
		await this.want.connect(accounts.deployer).transfer(this.farm.address, testVars.TOKENS_MINT_AMOUNT / 4);
		await this.want.connect(accounts.deployer).transfer(accounts.vzgo.address, testVars.TOKENS_MINT_AMOUNT / 8);
		await this.earn.connect(accounts.deployer).transfer(this.farm.address, testVars.TOKENS_MINT_AMOUNT / 2);
		await this.earn.connect(accounts.deployer).transfer(this.fairLaunch.address, testVars.TOKENS_MINT_AMOUNT / 4);
		await this.ibToken.connect(accounts.deployer).transfer(this.vault.address, testVars.TOKENS_MINT_AMOUNT / 2);
		await this.gymToken.connect(accounts.holder).transfer(this.router.address, testVars.TOKENS_MINT_AMOUNT);
		// await this.tokenA.connect(accounts.deployer).transfer(accounts.vzgo.address, variables.TOKENS_MINT_AMOUNT / 2)
		// await this.tokenB.connect(accounts.deployer).transfer(this.router.address, variables.TOKENS_MINT_AMOUNT / 2)
	});

	describe("Constructor: ", function () {
		it("Should get the correct arguments after the constructor's work for first strategy: ", async function () {
			expect(await this.strategyAlpaca.operator()).to.equal(accounts.deployer.address);
			expect(await this.strategyAlpaca.strategist()).to.equal(accounts.deployer.address);
			expect(await this.strategyAlpaca.wantAddress()).to.equal(this.want.address);
			expect(await this.strategyAlpaca.owner()).to.equal(this.bank.address);
			expect(await this.strategyAlpaca.isAutoComp()).to.equal(false);
		});
	});

	describe("isAuthorised function: ", function () {
		it("Should return true if account is operator or strategist: ", async function () {
			expect(await this.strategyAlpaca.isAuthorised(accounts.deployer.address)).to.equal(true);
		});

		it("Should return false if account is not operator or strategist: ", async function () {
			expect(await this.strategyAlpaca.isAuthorised(accounts.owner.address)).to.equal(false);
			expect(await this.strategyAlpaca.isAuthorised(accounts.holder.address)).to.equal(false);
			expect(await this.strategyAlpaca.isAuthorised(this.farm.address)).to.equal(false);
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

		it("Should receive first deposit from user: ", async function () {
			await this.bank.deposit(this.strategyAlpaca.address, testVars.TX_AMOUNT);
			expect(await this.want.balanceOf(this.strategyAlpaca.address)).to.equal(testVars.TX_AMOUNT);
			expect(await this.strategyAlpaca.wantLockedTotal()).to.equal(testVars.TX_AMOUNT);
			expect(await this.strategyAlpaca.sharesTotal()).to.equal(testVars.TX_AMOUNT);
		});

		it("Should receive second deposit from user: ", async function () {
			await this.bank.deposit(this.strategyAlpaca.address, testVars.TX_AMOUNT * 2);

			expect(await this.want.balanceOf(this.strategyAlpaca.address)).to.equal(testVars.TX_AMOUNT * 3);
			expect(await this.strategyAlpaca.wantLockedTotal()).to.equal(testVars.TX_AMOUNT * 3);
			expect(await this.strategyAlpaca.sharesTotal()).to.equal(testVars.TX_AMOUNT * 3);
			expect(await this.strategyAlpaca.sharesTotal()).to.equal(testVars.TX_AMOUNT * 3);
		});
	});

	describe("Farm function: ", function () {
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

		it("Should stake token for farming: ", async function () {
			const farmBalBefore = await this.want.balanceOf(this.vault.address);

			await this.bank.deposit(this.strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);

			expect(await this.want.balanceOf(this.vault.address)).to.equal(Number(farmBalBefore) + testVars.TX_AMOUNT);
			expect(await this.strategyAlpacaAutoComp.wantLockedTotal()).to.equal(testVars.TX_AMOUNT);
		});
	});

	describe("Withdraw function: ", function () {
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

		it("Should revert with 'GymVaultsStrategy: !_wantAmt': ", async function () {
			await this.bank.deposit(this.strategyAlpaca.address, testVars.TX_AMOUNT);

			await expect(this.bank.withdraw(this.strategyAlpaca.address, 0)).to.be.revertedWith(
				"GymVaultsStrategyAlpaca: !_wantAmt"
			);
		});

		it("Should withdraw tokens(isAutoComp): ", async function () {
			const withdrawAmount = testVars.TX_AMOUNT / 4;

			await this.bank.deposit(this.strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);

			const fairLaunchBefore = await this.vault.balanceOf(this.fairLaunch.address);
			const wantBalBefore = await this.want.balanceOf(this.vault.address);
			const bankBalBefore = await this.want.balanceOf(this.bank.address);
			const wantLockedTotalBefore = await this.strategyAlpacaAutoComp.wantLockedTotal();
			const sharesTotalBefore = await this.strategyAlpacaAutoComp.sharesTotal();

			await this.bank.withdraw(this.strategyAlpacaAutoComp.address, withdrawAmount);

			const sharesTotalAfter = sharesTotalBefore - (withdrawAmount * sharesTotalBefore) / wantLockedTotalBefore;

			expect(await this.vault.balanceOf(this.fairLaunch.address)).to.equal(fairLaunchBefore - withdrawAmount);
			expect((await this.want.balanceOf(this.bank.address)) - bankBalBefore).to.equal(withdrawAmount);
			expect(await this.want.balanceOf(this.vault.address)).to.equal(wantBalBefore - withdrawAmount);
			expect(await this.strategyAlpacaAutoComp.wantLockedTotal()).to.equal(
				wantLockedTotalBefore - withdrawAmount
			);
			expect(await this.strategyAlpacaAutoComp.sharesTotal()).to.equal(sharesTotalAfter);
		});

		it("Should withdraw tokens(!isAutoComp): ", async function () {
			const withdrawAmount = testVars.TX_AMOUNT / 4;

			await this.bank.deposit(this.strategyAlpaca.address, testVars.TX_AMOUNT);

			const wantLockedTotalBefore = await this.strategyAlpaca.wantLockedTotal();
			const bankBalBefore = await this.want.balanceOf(this.bank.address);
			const sharesTotalBefore = await this.strategyAlpaca.sharesTotal();

			await this.bank.withdraw(this.strategyAlpaca.address, withdrawAmount);

			expect(await this.want.balanceOf(this.bank.address)).to.equal(Number(bankBalBefore) + withdrawAmount);
			expect(await this.strategyAlpaca.wantLockedTotal()).to.equal(wantLockedTotalBefore - withdrawAmount);
			expect(await this.strategyAlpaca.sharesTotal()).to.equal(sharesTotalBefore - withdrawAmount);
		});
	});

	describe("DistributeFees function: ", function () {
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

		it("Should distribute earned tokens: ", async function () {
			const feeMax = await this.strategyAlpacaAutoComp.controllerFeeMax();

			await this.bank.deposit(this.strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);

			const deployerEarnBal = Number(await this.earn.balanceOf(accounts.deployer.address));

			await this.strategyAlpacaAutoComp.connect(accounts.deployer).setControllerFee(testVars.FEE);

			await this.strategyAlpacaAutoComp.earn(0, new Date().getTime() + 20);

			expect(await this.earn.balanceOf(accounts.deployer.address)).to.equal(
				deployerEarnBal + (testVars.FAIR_LAUNCH_RETURN_AMOUNT * testVars.FEE) / feeMax
			);
		});
	});

	describe("Earn function: ", function () {
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

		it("Should revert with 'GymVaultsStrategyAlpaca: !isAutoComp': ", async function () {
			await expect(this.strategyAlpaca.earn(0, new Date().getTime() + 20)).to.be.revertedWith(
				"GymVaultsStrategyAlpaca: !isAutoComp"
			);
		});

		it("Should revert with 'GymVaultsStrategyAlpaca: !authorised': ", async function () {
			await this.strategyAlpacaAutoComp.connect(accounts.deployer).setNotPublic(true);
			await expect(
				this.strategyAlpacaAutoComp.connect(accounts.vzgo).earn(0, new Date().getTime() + 20)
			).to.be.revertedWith("GymVaultsStrategyAlpaca: !authorised");
		});

		it("Should leave staking and call farm again: ", async function () {
			await this.bank.deposit(this.strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);

			const vaultBalBefore = await this.want.balanceOf(this.vault.address);

			const tx = await this.strategyAlpacaAutoComp.earn(0, new Date().getTime() + 20);

			expect(await this.strategyAlpacaAutoComp.lastEarnBlock()).to.equal(tx.blockNumber);
			expect(await this.want.balanceOf(this.vault.address)).to.equal(
				Number(vaultBalBefore) + testVars.FAIR_LAUNCH_RETURN_AMOUNT
			);
		});
	});

	describe("convertDustToEarned function: ", function () {
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

		it("Should revert with 'GymVaultsStrategyAlpaca: !isAutoComp': ", async function () {
			await expect(this.strategyAlpaca.convertDustToEarned(0, new Date().getTime() + 20)).to.be.revertedWith(
				"GymVaultsStrategyAlpaca: !isAutoComp"
			);
		});

		it("Should convert dust tokens into earned tokens: ", async function () {
			await this.want
				.connect(accounts.deployer)
				.transfer(this.strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);
			await this.earn.connect(accounts.deployer).transfer(this.router.address, testVars.TX_AMOUNT);

			await this.strategyAlpacaAutoComp.convertDustToEarned(0, new Date().getTime() + 20);

			expect(await this.earn.balanceOf(this.strategyAlpacaAutoComp.address)).to.equal(testVars.TX_AMOUNT);
		});
	});
});
