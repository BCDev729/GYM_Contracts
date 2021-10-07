const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers
} = require("hardhat");
const { getContract, getNamedSigners } = ethers;
const variables = require("../../utils/constants/solpp")("hardhat");

describe("GymMLM contract: ", function () {

	let accounts, snapshotId, deployer, owner, caller, holder, grno, vzgo;
	let gymVaultsBank, gymToken, buyBack, gymMLM, wantToken, WBNBMock, strategy, strategyAlpaca, routerMock;
	const depositAmount = 500;
	const transferAmount = 5000;
	const gymMLMReward = variables.GymVaultsBank_RELATIONSHIP_REWARD;
	const gymMLMBonuses = variables.GymMLM_DIRECT_REFERRAL_BONUSES;
	const gymMLMAmount = (depositAmount * gymMLMReward) / 100;
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({caller, holder, deployer, grno, vzgo, owner} = accounts);

		await fixture("Hardhat");

		gymToken = await getContract("GymToken", caller);

		gymVaultsBank = await getContract("GymVaultsBank", caller);

		buyBack = await getContract("BuyBack", caller);

		gymMLM = await getContract("GymMLM", deployer);
		await gymMLM.setBankAddress(gymVaultsBank.address);
		wantToken = await getContract("WantToken2", caller);
		WBNBMock = await getContract("WBNBMock", caller);
		strategy = await getContract("StrategyMock2", caller);
		strategyAlpaca = await getContract("StrategyMock", caller);
		routerMock = await getContract("RouterMock", caller);

		await gymToken.connect(holder).delegate(buyBack.address);
		await gymVaultsBank.connect(deployer).setTreasuryAddress(deployer.address);

		for (const signer in accounts) {
			if (signer === "deployer") {
				continue;
			}

			await wantToken.connect(deployer).transfer(accounts[signer].address, transferAmount);
		}

		await wantToken.connect(deployer).transfer(routerMock.address, transferAmount);
		await wantToken.connect(deployer).transfer(grno.address, transferAmount);

		await gymToken.connect(holder).transfer(gymVaultsBank.address, 100000);
		await gymToken.connect(holder).transfer(routerMock.address, 100000);

		await gymVaultsBank
			.connect(deployer)
			.add(WBNBMock.address, 20, false, strategyAlpaca.address);
		await gymVaultsBank
			.connect(deployer)
			.add(wantToken.address, 20, true, strategy.address);
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values: ", async function () {
			expect(await gymMLM.bankAddress()).to.equal(gymVaultsBank.address);
			expect(await gymMLM.addressToId(deployer.address)).to.equal(1);
			expect(await gymMLM.idToAddress(1)).to.equal(deployer.address);
			expect(await gymMLM.userToReferrer(await gymMLM.idToAddress(1))).to.equal(
				deployer.address
			);
			expect(await gymMLM.currentId()).to.equal(2);
			for (let i = 0; i < variables.GymMLM_DIRECT_REFERRAL_BONUSES_LENGTH; i++) {
				expect(await gymMLM.directReferralBonuses(i)).to.equal(
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
			const currentId = await gymMLM.currentId();
			const referrerId = await gymMLM.addressToId(deployer.address);

			expect(await gymMLM.userToReferrer(await gymMLM.idToAddress(currentId))).to.equal(
				await gymMLM.idToAddress(0)
			);

			await wantToken.connect(vzgo).approve(gymVaultsBank.address, depositAmount);
			await gymVaultsBank
				.connect(vzgo)
				.deposit(1, depositAmount, referrerId, 0, new Date().getTime() + 20);

			expect(await gymMLM.userToReferrer(await gymMLM.idToAddress(currentId))).to.equal(
				await gymMLM.idToAddress(referrerId)
			);
		});

		it("Should revert with 'GymMLM::referrer is zero address': ", async function () {
			await wantToken.connect(vzgo).approve(gymVaultsBank.address, depositAmount);
			await expect(
				gymVaultsBank.connect(vzgo).deposit(1, depositAmount, 4, 0, new Date().getTime() + 20)
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
			let ownerBal = (await wantToken.balanceOf(owner.address)).sub(depositAmount);

			for (const signer in accounts) {
				if (signer === "deployer") {
					continue;
				}

				await wantToken.connect(accounts[signer]).approve(gymVaultsBank.address, depositAmount);
				await gymVaultsBank
					.connect(accounts[signer])
					.deposit(
						1,
						depositAmount,
						gymMLM.addressToId(accounts[prevSigner].address),
						0,
						new Date().getTime() + 20
					);

				if (index === 0) {
					prevSigner = signer;
					prevSignerBal = await wantToken.balanceOf(accounts[signer].address);
					index++;
					continue;
				}

				if (index === 16) {
					expect((await wantToken.balanceOf(owner.address)).sub(ownerBal)).to.equal(0);
				} else {
					expect((await wantToken.balanceOf(owner.address)).sub(ownerBal)).to.equal(
						Math.floor((depositAmount * gymMLMBonuses[index - 1]) / 100)
					);
				}
				expect((await wantToken.balanceOf(accounts[prevSigner].address)).sub(prevSignerBal)).to.equal(
					Math.floor((depositAmount * gymMLMBonuses[0]) / 100)
				);

				ownerBal = await wantToken.balanceOf(owner.address);
				prevSigner = signer;
				prevSignerBal = await wantToken.balanceOf(accounts[prevSigner].address);
				index++;
			}
		});

		it("Should transfer unmute tokens to treasure address: ", async function () {
			let deployerAmtBefore = await wantToken.balanceOf(deployer.address);
			await wantToken.connect(vzgo).approve(gymVaultsBank.address, depositAmount);
			await gymVaultsBank
				.connect(vzgo)
				.deposit(
					1,
					depositAmount,
					await gymMLM.addressToId(deployer.address),
					0,
					new Date().getTime() + 20
				);

			expect((await wantToken.balanceOf(deployer.address)).sub(deployerAmtBefore)).to.equal(
				gymMLMAmount
			);
			deployerAmtBefore = await wantToken.balanceOf(deployer.address);

			await wantToken.connect(grno).approve(gymVaultsBank.address, depositAmount);
			await gymVaultsBank
				.connect(grno)
				.deposit(
					1,
					depositAmount,
					await gymMLM.addressToId(vzgo.address),
					0,
					new Date().getTime() + 20
				);

			expect((await wantToken.balanceOf(deployer.address)).sub(deployerAmtBefore)).to.equal(
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

				tx = await gymVaultsBank
					.connect(accounts[signer])
					.deposit(
						0,
						0,
						await gymMLM.addressToId(accounts[prevSigner].address),
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
			await gymVaultsBank
				.connect(vzgo)
				.deposit(0, 0, await gymMLM.addressToId(deployer.address), 0, new Date().getTime() + 20, {
					value: depositAmount
				});

			expect((await deployer.getBalance()).sub(deployerAmtBefore)).to.equal(gymMLMAmount);
			deployerAmtBefore = await deployer.getBalance();

			await gymVaultsBank
				.connect(grno)
				.deposit(0, 0, await gymMLM.addressToId(vzgo.address), 0, new Date().getTime() + 20, {
					value: depositAmount
				});

			expect((await deployer.getBalance()).sub(deployerAmtBefore)).to.equal(
				gymMLMAmount - (depositAmount * gymMLMBonuses[0]) / 100
			);
		});
	});
});
