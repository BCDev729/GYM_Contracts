const { expect } = require("chai");
const {
	deployments: { fixture, deploy },
	network,
	ethers
} = require("hardhat");
const {
	getContract,
	getNamedSigners,
	constants: { AddressZero } } = ethers;
const testVars = require("../../utils/constants/data/testVariables.json");


describe("GymVaultsStrategyAlpaca contract: ", function () {
	let accounts, deployer, owner, caller, holder, vzgo;
	let router, farm, vault, fairLaunch, bank, gymToken, want, earn, ibToken;
	let strategyAlpacaAutoComp, strategyAlpaca, snapshotStart;
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({ deployer, owner, caller, holder, vzgo } = accounts);
		await fixture("Hardhat");

		router = await getContract("RouterMock");
		farm = await getContract("FarmMock");
		vault = await getContract("VaultMock");
		fairLaunch = await getContract("FairLaunchMock");
		bank = await getContract("BankMock", caller);
		gymToken = await getContract("GymToken", caller);
		want = await getContract("WantToken1", caller);
		earn = await getContract("EarnToken", caller);
		ibToken = await getContract("ibToken", caller);

		strategyAlpaca = await getContract("GymVaultsStrategyAlpaca", caller);

		await deploy("GymVaultsStrategyAlpaca", {
			from: deployer.address,
			args: [
				bank.address,
				true,
				vault.address,
				fairLaunch.address,
				0, // pid
				want.address,
				earn.address,
				router.address
			],
			log: true,
			deterministicDeployment: false
		});

		strategyAlpacaAutoComp = await getContract("GymVaultsStrategyAlpaca", caller);

		await want.connect(deployer).transfer(bank.address, testVars.TOKENS_MINT_AMOUNT / 4);
		await want.connect(deployer).transfer(router.address, testVars.TOKENS_MINT_AMOUNT / 4);
		await want.connect(deployer).transfer(farm.address, testVars.TOKENS_MINT_AMOUNT / 4);
		await want.connect(deployer).transfer(vzgo.address, testVars.TOKENS_MINT_AMOUNT / 8);
		await earn.connect(deployer).transfer(farm.address, testVars.TOKENS_MINT_AMOUNT / 2);
		await earn.connect(deployer).transfer(fairLaunch.address, testVars.TOKENS_MINT_AMOUNT / 4);
		await ibToken.connect(deployer).transfer(vault.address, testVars.TOKENS_MINT_AMOUNT / 2);
		await gymToken.connect(holder).transfer(router.address, testVars.TOKENS_MINT_AMOUNT);
	});

	describe("Constructor: ", function () {
		it("Should get the correct arguments after the constructor's work for first strategy: ", async function () {
			expect(await strategyAlpaca.operator()).to.equal(deployer.address);
			expect(await strategyAlpaca.strategist()).to.equal(deployer.address);
			expect(await strategyAlpaca.wantAddress()).to.equal(want.address);
			expect(await strategyAlpaca.owner()).to.equal(bank.address);
			expect(await strategyAlpaca.isAutoComp()).to.equal(false);
		});
	});

	describe("isAuthorised function: ", function () {
		it("Should return true if account is operator or strategist: ", async function () {
			expect(await strategyAlpaca.isAuthorised(deployer.address)).to.equal(true);
		});

		it("Should return false if account is not operator or strategist: ", async function () {
			expect(await strategyAlpaca.isAuthorised(owner.address)).to.equal(false);
			expect(await strategyAlpaca.isAuthorised(holder.address)).to.equal(false);
			expect(await strategyAlpaca.isAuthorised(farm.address)).to.equal(false);
		});
	});

	describe("Deposit function: ", function () {
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

		it("Should emit Deposit event with correct args", async function () {
			await expect(bank.connect(deployer).deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT))
				.to
				.emit(strategyAlpacaAutoComp, "Deposit")
				.withArgs(testVars.TX_AMOUNT);
		});

		it("Should receive first deposit from user: ", async function () {
			await bank.deposit(strategyAlpaca.address, testVars.TX_AMOUNT);
			expect(await want.balanceOf(strategyAlpaca.address)).to.equal(testVars.TX_AMOUNT);
			expect(await strategyAlpaca.wantLockedTotal()).to.equal(testVars.TX_AMOUNT);
			expect(await strategyAlpaca.sharesTotal()).to.equal(testVars.TX_AMOUNT);
		});

		it("Should receive second deposit from user: ", async function () {
			await bank.deposit(strategyAlpaca.address, testVars.TX_AMOUNT * 2);

			expect(await want.balanceOf(strategyAlpaca.address)).to.equal(testVars.TX_AMOUNT * 3);
			expect(await strategyAlpaca.wantLockedTotal()).to.equal(testVars.TX_AMOUNT * 3);
			expect(await strategyAlpaca.sharesTotal()).to.equal(testVars.TX_AMOUNT * 3);
			expect(await strategyAlpaca.sharesTotal()).to.equal(testVars.TX_AMOUNT * 3);
		});
	});

	describe("Farm function: ", function () {
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

		it("Should stake token for farming: ", async function () {
			const farmBalBefore = await want.balanceOf(vault.address);

			await bank.deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);

			expect(await want.balanceOf(vault.address)).to.equal(Number(farmBalBefore) + testVars.TX_AMOUNT);
			expect(await strategyAlpacaAutoComp.wantLockedTotal()).to.equal(testVars.TX_AMOUNT);
		});

		it("Should emit Farm event with correct args", async function () {
			const wantAmt = await want.balanceOf(strategyAlpacaAutoComp.address);
			await bank.deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);
			await expect(strategyAlpacaAutoComp.farm())
				.to
				.emit(strategyAlpacaAutoComp, "Farm")
				.withArgs(wantAmt);
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

		it("Should revert with 'GymVaultsStrategy: !_wantAmt': ", async function () {
			await bank.deposit(strategyAlpaca.address, testVars.TX_AMOUNT);

			await expect(bank.withdraw(strategyAlpaca.address, 0)).to.be.revertedWith(
				"GymVaultsStrategyAlpaca: !_wantAmt"
			);
		});

		it("Should emit Withdraw event with correct values", async function () {
			const withdrawAmount = testVars.TX_AMOUNT / 4;
			await bank.deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);
			await expect(bank.withdraw(strategyAlpacaAutoComp.address, withdrawAmount))
				.to
				.emit(strategyAlpacaAutoComp, "Withdraw")
				.withArgs(withdrawAmount);
		});

		it("Should withdraw tokens(isAutoComp): ", async function () {
			const withdrawAmount = testVars.TX_AMOUNT / 4;

			await bank.deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);

			const fairLaunchBefore = await vault.balanceOf(fairLaunch.address);
			const wantBalBefore = await want.balanceOf(vault.address);
			const bankBalBefore = await want.balanceOf(bank.address);
			const wantLockedTotalBefore = await strategyAlpacaAutoComp.wantLockedTotal();
			const sharesTotalBefore = await strategyAlpacaAutoComp.sharesTotal();

			await bank.withdraw(strategyAlpacaAutoComp.address, withdrawAmount);

			const sharesTotalAfter = sharesTotalBefore - (withdrawAmount * sharesTotalBefore) / wantLockedTotalBefore;

			expect(await vault.balanceOf(fairLaunch.address)).to.equal(fairLaunchBefore - withdrawAmount);
			expect((await want.balanceOf(bank.address)) - bankBalBefore).to.equal(withdrawAmount);
			expect(await want.balanceOf(vault.address)).to.equal(wantBalBefore - withdrawAmount);
			expect(await strategyAlpacaAutoComp.wantLockedTotal()).to.equal(wantLockedTotalBefore - withdrawAmount);
			expect(await strategyAlpacaAutoComp.sharesTotal()).to.equal(sharesTotalAfter);
		});

		it("Should withdraw tokens(!isAutoComp): ", async function () {
			const withdrawAmount = testVars.TX_AMOUNT / 4;

			await bank.deposit(strategyAlpaca.address, testVars.TX_AMOUNT);

			const wantLockedTotalBefore = await strategyAlpaca.wantLockedTotal();
			const bankBalBefore = await want.balanceOf(bank.address);
			const sharesTotalBefore = await strategyAlpaca.sharesTotal();

			await bank.withdraw(strategyAlpaca.address, withdrawAmount);

			expect(await want.balanceOf(bank.address)).to.equal(Number(bankBalBefore) + withdrawAmount);
			expect(await strategyAlpaca.wantLockedTotal()).to.equal(wantLockedTotalBefore - withdrawAmount);
			expect(await strategyAlpaca.sharesTotal()).to.equal(sharesTotalBefore - withdrawAmount);
		});
	});

	describe("DistributeFees function: ", function () {
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

		it("Should distribute earned tokens: ", async function () {
			const feeMax = await strategyAlpacaAutoComp.controllerFeeMax();

			await bank.deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);

			const deployerEarnBal = Number(await earn.balanceOf(deployer.address));

			await strategyAlpacaAutoComp.connect(deployer).setControllerFee(testVars.FEE);

			await strategyAlpacaAutoComp.earn(0, new Date().getTime() + 20);

			expect(await earn.balanceOf(deployer.address)).to.equal(
				deployerEarnBal + (testVars.FAIR_LAUNCH_RETURN_AMOUNT * testVars.FEE) / feeMax
			);
		});

		it("Should emit DistributeFee event with correct args", async function () {
			const snapshot1 = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await bank.connect(vzgo).deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);
			await fairLaunch.connect(vzgo).harvest(0);
			const earnedAmt = await earn.balanceOf(vzgo.address);

			await network.provider.request({
				method: "evm_revert",
				params: [snapshot1]
			});
			await strategyAlpacaAutoComp.connect(deployer).setControllerFee(testVars.FEE);

			await bank.deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);

			await strategyAlpacaAutoComp.earn(0, new Date().getTime() + 20);


			const earnedAddress = await strategyAlpacaAutoComp.earnedAddress();
			const controllerFeeMax = await strategyAlpacaAutoComp.controllerFeeMax();
			const controllerFee = await strategyAlpacaAutoComp.controllerFee();
			const operator = await strategyAlpacaAutoComp.operator();
			const fee = await (earnedAmt * controllerFee) / controllerFeeMax;
			await expect(strategyAlpacaAutoComp.earn(0, new Date().getTime() + 20))
				.to
				.emit(strategyAlpacaAutoComp, "DistributeFee")
				.withArgs(earnedAddress, fee, operator);
		});
	});

	describe("Earn function: ", function () {
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

		it("Should revert with 'GymVaultsStrategyAlpaca: !isAutoComp': ", async function () {
			await expect(strategyAlpaca.earn(0, new Date().getTime() + 20)).to.be.revertedWith(
				"GymVaultsStrategyAlpaca: !isAutoComp"
			);
		});

		it("Should revert with 'GymVaultsStrategyAlpaca: !authorised': ", async function () {
			await strategyAlpacaAutoComp.connect(deployer).setNotPublic(true);
			await expect(strategyAlpacaAutoComp.connect(vzgo).earn(0, new Date().getTime() + 20)).to.be.revertedWith(
				"GymVaultsStrategyAlpaca: !authorised"
			);
		});

		it("Should leave staking and call farm again: ", async function () {
			await bank.deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);

			const vaultBalBefore = await want.balanceOf(vault.address);

			const tx = await strategyAlpacaAutoComp.earn(0, new Date().getTime() + 20);

			expect(await strategyAlpacaAutoComp.lastEarnBlock()).to.equal(tx.blockNumber);
			expect(await want.balanceOf(vault.address)).to.equal(
				Number(vaultBalBefore) + testVars.FAIR_LAUNCH_RETURN_AMOUNT
			);
		});

		it("Should emit Earned event with correct args", async function () {
			const snapshot1 = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await bank.connect(vzgo).deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);
			await fairLaunch.connect(vzgo).harvest(0);
			const earnedAmt = await earn.balanceOf(vzgo.address);

			await network.provider.request({
				method: "evm_revert",
				params: [snapshot1]
			});

			const earnedAddress = await strategyAlpacaAutoComp.earnedAddress();

			await expect(strategyAlpacaAutoComp.earn(0, new Date().getTime() + 20))
				.to
				.emit(strategyAlpacaAutoComp, "Earned")
				.withArgs(earnedAddress, earnedAmt);
		});

		it("Should emit Compound event with correct args", async function () {
			const snapshot1 = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await bank.connect(vzgo).deposit(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);
			await fairLaunch.connect(vzgo).harvest(0);
			const earnedAmt = await earn.balanceOf(vzgo.address);

			await network.provider.request({
				method: "evm_revert",
				params: [snapshot1]
			});

			await expect(strategyAlpacaAutoComp.earn(0, new Date().getTime() + 20))
				.to
				.emit(strategyAlpacaAutoComp, "Compound")
				.withArgs(want.address, earnedAmt, AddressZero, 0);
		});
	});

	describe("convertDustToEarned function: ", function () {
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

		it("Should revert with 'GymVaultsStrategyAlpaca: !isAutoComp': ", async function () {
			await expect(strategyAlpaca.convertDustToEarned(0, new Date().getTime() + 20)).to.be.revertedWith(
				"GymVaultsStrategyAlpaca: !isAutoComp"
			);
		});

		it("Should convert dust tokens into earned tokens: ", async function () {
			await want.connect(deployer).transfer(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);
			await earn.connect(deployer).transfer(router.address, testVars.TX_AMOUNT);

			await strategyAlpacaAutoComp.convertDustToEarned(0, new Date().getTime() + 20);

			expect(await earn.balanceOf(strategyAlpacaAutoComp.address)).to.equal(testVars.TX_AMOUNT);
		});

		it("Should emit ConvertDustToEarned event with correct args", async function () {
			await want.connect(deployer).transfer(strategyAlpacaAutoComp.address, testVars.TX_AMOUNT);
			await earn.connect(deployer).transfer(router.address, testVars.TX_AMOUNT);

			const wantAddress = await want.address;
			const earnAddress = await earn.address;
			const wantAmt = await want.balanceOf(strategyAlpacaAutoComp.address);

			await expect(strategyAlpacaAutoComp.convertDustToEarned(0, new Date().getTime() + 20))
				.to
				.emit(strategyAlpacaAutoComp, "ConvertDustToEarned")
				.withArgs(wantAddress, earnAddress, wantAmt);
		});
	});
});
