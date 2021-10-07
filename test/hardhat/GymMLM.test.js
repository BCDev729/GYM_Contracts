const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers,
	run
} = require("hardhat");
const { getContract, getNamedSigners } = ethers;
const variables = require("../../utils/constants/solpp")("hardhat");

let accounts, snapshotId;
const depositAmount = 500;
const transferAmount = 5000;
const gymMLMReward = variables.GymVaultsBank_RELATIONSHIP_REWARD;
const gymMLMBonuses = variables.GymMLM_DIRECT_REFERRAL_BONUSES;
const gymMLMAmount = (depositAmount * gymMLMReward) / 100;

describe("GymMLM contract: ", function () {
	before("Before All: ", async function () {
		accounts = await getNamedSigners();

		await fixture();

		this.gymToken = await getContract("GymToken", accounts.caller);

		this.gymVaultsBank = await getContract("GymVaultsBank", accounts.caller);

		this.buyBack = await getContract("BuyBack", accounts.caller);

		this.gymMLM = await getContract("GymMLM", accounts.deployer);
		await this.gymMLM.setBankAddress(this.gymVaultsBank.address);
		this.wantToken = await getContract("WantToken2", accounts.caller);
		this.WBNBMock = await getContract("WBNBMock", accounts.caller);
		this.strategy = await getContract("StrategyMock2", accounts.caller);
		this.strategyAlpaca = await getContract("StrategyMock", accounts.caller);
		this.routerMock = await getContract("RouterMock", accounts.caller);

		await this.gymToken.connect(accounts.holder).delegate(this.buyBack.address);
		await this.gymVaultsBank.connect(accounts.deployer).setTreasuryAddress(accounts.deployer.address);

		for (const signer in accounts) {
			if (signer === "deployer") {
				continue;
			}

			await this.wantToken.connect(accounts.deployer).transfer(accounts[signer].address, transferAmount);
		}

		await this.wantToken.connect(accounts.deployer).transfer(this.routerMock.address, transferAmount);
		await this.wantToken.connect(accounts.deployer).transfer(accounts.grno.address, transferAmount);

		await this.gymToken.connect(accounts.holder).transfer(this.gymVaultsBank.address, 100000);
		await this.gymToken.connect(accounts.holder).transfer(this.routerMock.address, 100000);

		await run("gymVaultsBank:add", {
			want: this.WBNBMock.address,
			allocPoint: "20",
			withUpdate: "false",
			strategy: this.strategyAlpaca.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:add", {
			want: this.wantToken.address,
			allocPoint: "20",
			withUpdate: "true",
			strategy: this.strategy.address,
			caller: "deployer"
		});
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values: ", async function () {
			expect(await this.gymMLM.bankAddress()).to.equal(this.gymVaultsBank.address);
			expect(await this.gymMLM.addressToId(accounts.deployer.address)).to.equal(1);
			expect(await this.gymMLM.idToAddress(1)).to.equal(accounts.deployer.address);
			expect(await this.gymMLM.userToReferrer(await this.gymMLM.idToAddress(1))).to.equal(
				accounts.deployer.address
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
			const referrerId = await this.gymMLM.addressToId(accounts.deployer.address);

			expect(await this.gymMLM.userToReferrer(await this.gymMLM.idToAddress(currentId))).to.equal(
				await this.gymMLM.idToAddress(0)
			);

			await this.wantToken.connect(accounts.vzgo).approve(this.gymVaultsBank.address, depositAmount);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: `${depositAmount}`,
				referrerId: `${referrerId}`,
				caller: "vzgo"
			});

			expect(await this.gymMLM.userToReferrer(await this.gymMLM.idToAddress(currentId))).to.equal(
				await this.gymMLM.idToAddress(referrerId)
			);
		});

		it("Should revert with 'GymMLM::referrer is zero address': ", async function () {
			await this.wantToken.connect(accounts.vzgo).approve(this.gymVaultsBank.address, depositAmount);
			await expect(
				run("gymVaultsBank:deposit", {
					pid: "1",
					wantAmt: `${depositAmount}`,
					referrerId: "4",
					caller: "vzgo"
				})
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
			let ownerBal = (await this.wantToken.balanceOf(accounts.owner.address)).sub(depositAmount);

			for (const signer in accounts) {
				if (signer === "deployer") {
					continue;
				}

				await this.wantToken.connect(accounts[signer]).approve(this.gymVaultsBank.address, depositAmount);

				await run("gymVaultsBank:deposit", {
					pid: "1",
					wantAmt: `${depositAmount}`,
					referrerId: (await this.gymMLM.addressToId(accounts[prevSigner].address)).toString(),
					caller: signer
				});

				if (index === 0) {
					prevSigner = signer;
					prevSignerBal = await this.wantToken.balanceOf(accounts[signer].address);
					index++;
					continue;
				}

				if (index === 16) {
					expect((await this.wantToken.balanceOf(accounts.owner.address)).sub(ownerBal)).to.equal(0);
				} else {
					expect((await this.wantToken.balanceOf(accounts.owner.address)).sub(ownerBal)).to.equal(
						Math.floor((depositAmount * gymMLMBonuses[index - 1]) / 100)
					);
				}
				expect((await this.wantToken.balanceOf(accounts[prevSigner].address)).sub(prevSignerBal)).to.equal(
					Math.floor((depositAmount * gymMLMBonuses[0]) / 100)
				);

				ownerBal = await this.wantToken.balanceOf(accounts.owner.address);
				prevSigner = signer;
				prevSignerBal = await this.wantToken.balanceOf(accounts[prevSigner].address);
				index++;
			}
		});

		it("Should transfer unmute tokens to treasure address: ", async function () {
			let deployerAmtBefore = await this.wantToken.balanceOf(accounts.deployer.address);
			await this.wantToken.connect(accounts.vzgo).approve(this.gymVaultsBank.address, depositAmount);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: `${depositAmount}`,
				referrerId: (await this.gymMLM.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			expect((await this.wantToken.balanceOf(accounts.deployer.address)).sub(deployerAmtBefore)).to.equal(
				gymMLMAmount
			);
			deployerAmtBefore = await this.wantToken.balanceOf(accounts.deployer.address);

			await this.wantToken.connect(accounts.grno).approve(this.gymVaultsBank.address, depositAmount);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: `${depositAmount}`,
				referrerId: (await this.gymMLM.addressToId(accounts.vzgo.address)).toString(),
				caller: "grno"
			});

			expect((await this.wantToken.balanceOf(accounts.deployer.address)).sub(deployerAmtBefore)).to.equal(
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
			let ownerBal = (await accounts.owner.getBalance()).sub(depositAmount);
			let tx;

			for (const signer in accounts) {
				if (signer === "deployer") {
					continue;
				}
				tx = await run("gymVaultsBank:deposit", {
					pid: "0",
					wantAmt: "0",
					referrerId: (await this.gymMLM.addressToId(accounts[prevSigner].address)).toString(),
					caller: signer,
					bnbAmount: `${depositAmount}`
				});

				if (index === 0) {
					prevSigner = signer;
					prevSignerBal = await accounts[signer].getBalance();
					ownerBal = ownerBal.sub((await tx.wait()).gasUsed * tx.gasPrice);
					index++;
					continue;
				}

				if (index === 16) {
					expect((await accounts.owner.getBalance()).sub(ownerBal)).to.equal(0);
				} else {
					expect((await accounts.owner.getBalance()).sub(ownerBal)).to.equal(
						Math.floor((depositAmount * gymMLMBonuses[index - 1]) / 100)
					);
				}
				expect((await accounts[prevSigner].getBalance()).sub(prevSignerBal)).to.equal(
					Math.floor((depositAmount * gymMLMBonuses[0]) / 100)
				);

				ownerBal = await accounts.owner.getBalance();
				prevSigner = signer;
				prevSignerBal = await accounts[prevSigner].getBalance();
				index++;
			}
		});

		it("Should transfer unmute BNB to treasure address: ", async function () {
			let deployerAmtBefore = await accounts.deployer.getBalance();
			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await this.gymMLM.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: `${depositAmount}`
			});

			expect((await accounts.deployer.getBalance()).sub(deployerAmtBefore)).to.equal(gymMLMAmount);
			deployerAmtBefore = await accounts.deployer.getBalance();
			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await this.gymMLM.addressToId(accounts.vzgo.address)).toString(),
				caller: "grno",
				bnbAmount: `${depositAmount}`
			});

			expect((await accounts.deployer.getBalance()).sub(deployerAmtBefore)).to.equal(
				gymMLMAmount - (depositAmount * gymMLMBonuses[0]) / 100
			);
		});
	});
});
