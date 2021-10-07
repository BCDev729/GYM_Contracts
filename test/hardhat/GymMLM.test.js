const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers
} = require("hardhat");
const { getContract, getNamedSigners } = ethers;
const variables = require("../../utils/constants/solpp")("hardhat");

let accounts, snapshotId, deployer, owner, caller, holder, grno, vzgo;
const depositAmount = 500;
const transferAmount = 5000;
const gymMLMReward = variables.GymVaultsBank_RELATIONSHIP_REWARD;
const gymMLMBonuses = variables.GymMLM_DIRECT_REFERRAL_BONUSES;
const gymMLMAmount = (depositAmount * gymMLMReward) / 100;

describe("GymMLM contract: ", function () {
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({caller, holder, deployer, grno, vzgo, owner} = accounts);

		await fixture("Hardhat");

		this.gymToken = await getContract("GymToken", caller);

		this.gymVaultsBank = await getContract("GymVaultsBank", caller);

		this.buyBack = await getContract("BuyBack", caller);

		this.gymMLM = await getContract("GymMLM", deployer);
		await this.gymMLM.setBankAddress(this.gymVaultsBank.address);
		this.wantToken = await getContract("WantToken2", caller);
		this.WBNBMock = await getContract("WBNBMock", caller);
		this.strategy = await getContract("StrategyMock2", caller);
		this.strategyAlpaca = await getContract("StrategyMock", caller);
		this.routerMock = await getContract("RouterMock", caller);

		await this.gymToken.connect(holder).delegate(this.buyBack.address);
		await this.gymVaultsBank.connect(deployer).setTreasuryAddress(deployer.address);

		for (const signer in accounts) {
			if (signer === "deployer") {
				continue;
			}

			await this.wantToken.connect(deployer).transfer(accounts[signer].address, transferAmount);
		}

		await this.wantToken.connect(deployer).transfer(this.routerMock.address, transferAmount);
		await this.wantToken.connect(deployer).transfer(grno.address, transferAmount);

		await this.gymToken.connect(holder).transfer(this.gymVaultsBank.address, 100000);
		await this.gymToken.connect(holder).transfer(this.routerMock.address, 100000);

		await this.gymVaultsBank
			.connect(deployer)
			.add(this.WBNBMock.address, 20, false, this.strategyAlpaca.address);
		await this.gymVaultsBank
			.connect(deployer)
			.add(this.wantToken.address, 20, true, this.strategy.address);
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values: ", async function () {
			expect(await this.gymMLM.bankAddress()).to.equal(this.gymVaultsBank.address);
			expect(await this.gymMLM.addressToId(deployer.address)).to.equal(1);
			expect(await this.gymMLM.idToAddress(1)).to.equal(deployer.address);
			expect(await this.gymMLM.userToReferrer(await this.gymMLM.idToAddress(1))).to.equal(
				deployer.address
			);
			expect(await this.gymMLM.currentId()).to.equal(2);
			for (let i = 0; i < variables.GymMLM_DIRECT_REFERRAL_BONUSES_LENGTH; i++) {
				expect(await this.gymMLM.directReferralBonuses(i)).to.equal(
					variables.GymMLM_DIRECT_REFERRAL_BONUSES[i]
				);
			}
		});
	});

	describe("AddGymMLM function: ", function () {
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

		it("Should add new gymMLM: ", async function () {
			const currentId = await this.gymMLM.currentId();
			const referrerId = await this.gymMLM.addressToId(deployer.address);

			expect(await this.gymMLM.userToReferrer(await this.gymMLM.idToAddress(currentId))).to.equal(
				await this.gymMLM.idToAddress(0)
			);

			await this.wantToken.connect(vzgo).approve(this.gymVaultsBank.address, depositAmount);
			await this.gymVaultsBank
				.connect(vzgo)
				.deposit(1, depositAmount, referrerId, 0, new Date().getTime() + 20);

			expect(await this.gymMLM.userToReferrer(await this.gymMLM.idToAddress(currentId))).to.equal(
				await this.gymMLM.idToAddress(referrerId)
			);
		});

		it("Should revert with 'GymMLM::referrer is zero address': ", async function () {
			await this.wantToken.connect(vzgo).approve(this.gymVaultsBank.address, depositAmount);
			await expect(
				this.gymVaultsBank.connect(vzgo).deposit(1, depositAmount, 4, 0, new Date().getTime() + 20)
			).to.be.revertedWith("GymMLM::referrer is zero address");
		});
	});

	describe("DistributeRewards function for tokens: ", function () {
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

		it("Should distribute rewards for referrers: ", async function () {
			let prevSigner = "deployer";
			let index = 0;
			let prevSignerBal;
			let ownerBal = (await this.wantToken.balanceOf(owner.address)).sub(depositAmount);

			for (const signer in accounts) {
				if (signer === "deployer") {
					continue;
				}

				await this.wantToken.connect(accounts[signer]).approve(this.gymVaultsBank.address, depositAmount);
				await this.gymVaultsBank
					.connect(accounts[signer])
					.deposit(
						1,
						depositAmount,
						this.gymMLM.addressToId(accounts[prevSigner].address),
						0,
						new Date().getTime() + 20
					);

				if (index === 0) {
					prevSigner = signer;
					prevSignerBal = await this.wantToken.balanceOf(accounts[signer].address);
					index++;
					continue;
				}

				if (index === 16) {
					expect((await this.wantToken.balanceOf(owner.address)).sub(ownerBal)).to.equal(0);
				} else {
					expect((await this.wantToken.balanceOf(owner.address)).sub(ownerBal)).to.equal(
						Math.floor((depositAmount * gymMLMBonuses[index - 1]) / 100)
					);
				}
				expect((await this.wantToken.balanceOf(accounts[prevSigner].address)).sub(prevSignerBal)).to.equal(
					Math.floor((depositAmount * gymMLMBonuses[0]) / 100)
				);

				ownerBal = await this.wantToken.balanceOf(owner.address);
				prevSigner = signer;
				prevSignerBal = await this.wantToken.balanceOf(accounts[prevSigner].address);
				index++;
			}
		});

		it("Should transfer unmute tokens to treasure address: ", async function () {
			let deployerAmtBefore = await this.wantToken.balanceOf(deployer.address);
			await this.wantToken.connect(vzgo).approve(this.gymVaultsBank.address, depositAmount);
			await this.gymVaultsBank
				.connect(vzgo)
				.deposit(
					1,
					depositAmount,
					await this.gymMLM.addressToId(deployer.address),
					0,
					new Date().getTime() + 20
				);

			expect((await this.wantToken.balanceOf(deployer.address)).sub(deployerAmtBefore)).to.equal(
				gymMLMAmount
			);
			deployerAmtBefore = await this.wantToken.balanceOf(deployer.address);

			await this.wantToken.connect(grno).approve(this.gymVaultsBank.address, depositAmount);
			await this.gymVaultsBank
				.connect(grno)
				.deposit(
					1,
					depositAmount,
					await this.gymMLM.addressToId(vzgo.address),
					0,
					new Date().getTime() + 20
				);

			expect((await this.wantToken.balanceOf(deployer.address)).sub(deployerAmtBefore)).to.equal(
				gymMLMAmount - (depositAmount * gymMLMBonuses[0]) / 100
			);
		});
	});

	describe("DistributeRewards function for BNB: ", function () {
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

		it("Should distribute rewards for referrers: ", async function () {
			let prevSigner = "deployer";
			let index = 0;
			let prevSignerBal;
			let ownerBal = (await owner.getBalance()).sub(depositAmount);
			let tx;

			for (const signer in accounts) {
				if (signer === "deployer") {
					continue;
				}

				tx = await this.gymVaultsBank
					.connect(accounts[signer])
					.deposit(
						0,
						0,
						await this.gymMLM.addressToId(accounts[prevSigner].address),
						0,
						new Date().getTime() + 20,
						{
							value: depositAmount
						}
					);

				if (index === 0) {
					prevSigner = signer;
					prevSignerBal = await accounts[signer].getBalance();
					ownerBal = ownerBal.sub((await tx.wait()).gasUsed * tx.gasPrice);
					index++;
					continue;
				}

				if (index === 16) {
					expect((await owner.getBalance()).sub(ownerBal)).to.equal(0);
				} else {
					expect((await owner.getBalance()).sub(ownerBal)).to.equal(
						Math.floor((depositAmount * gymMLMBonuses[index - 1]) / 100)
					);
				}
				expect((await accounts[prevSigner].getBalance()).sub(prevSignerBal)).to.equal(
					Math.floor((depositAmount * gymMLMBonuses[0]) / 100)
				);

				ownerBal = await owner.getBalance();
				prevSigner = signer;
				prevSignerBal = await accounts[prevSigner].getBalance();
				index++;
			}
		});

		it("Should transfer unmute BNB to treasure address: ", async function () {
			let deployerAmtBefore = await deployer.getBalance();
			await this.gymVaultsBank
				.connect(vzgo)
				.deposit(0, 0, await this.gymMLM.addressToId(deployer.address), 0, new Date().getTime() + 20, {
					value: depositAmount
				});

			expect((await deployer.getBalance()).sub(deployerAmtBefore)).to.equal(gymMLMAmount);
			deployerAmtBefore = await deployer.getBalance();

			await this.gymVaultsBank
				.connect(grno)
				.deposit(0, 0, await this.gymMLM.addressToId(vzgo.address), 0, new Date().getTime() + 20, {
					value: depositAmount
				});

			expect((await deployer.getBalance()).sub(deployerAmtBefore)).to.equal(
				gymMLMAmount - (depositAmount * gymMLMBonuses[0]) / 100
			);
		});
	});
});
