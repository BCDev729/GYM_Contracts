const { expect } = require("chai");
const {
	config: {
		solpp: { defs }
	},
	deployments: { fixture },
	network,
	ethers: {
		getContract,
		getNamedSigners,
		utils: { parseEther }
	},
	run
} = require("hardhat");

describe("GymMLM contract: ", function () {
	let accounts, snapshotId, deployer, owner, caller, holder, grno, vzgo;
	let gymVaultsBank, gymToken, buyBack, gymMLM, wantToken, WBNBMock, strategy, strategyAlpaca, routerMock;
	const depositAmount = 500;
	const transferAmount = 5000;
	const gymMLMReward = defs.GymVaultsBank_RELATIONSHIP_REWARD;
	const gymMLMBonuses = defs.GymMLM_DIRECT_REFERRAL_BONUSES;
	const gymMLMAmount = (depositAmount * gymMLMReward) / 100;

	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({ caller, holder, deployer, grno, vzgo, owner } = accounts);

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

		await gymToken.connect(holder).transfer(gymVaultsBank.address, parseEther("200000"));
		await gymToken.connect(holder).transfer(routerMock.address, parseEther("200000"));

		await run("gymVaultsBank:add", {
			want: WBNBMock.address,
			allocPoint: "20",
			withUpdate: "false",
			strategy: strategyAlpaca.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:add", {
			want: wantToken.address,
			allocPoint: "20",
			withUpdate: "true",
			strategy: strategy.address,
			caller: "deployer"
		});

		await gymMLM.updateScoring(WBNBMock.address, 1e12);
		await gymMLM.updateScoring(wantToken.address, 1e11);
	});

	describe("Initialization: ", function () {
		it("Should initialize with correct values: ", async function () {
			expect(await gymMLM.bankAddress()).to.equal(gymVaultsBank.address);
			expect(await gymMLM.addressToId(deployer.address)).to.equal(1);
			expect(await gymMLM.idToAddress(1)).to.equal(deployer.address);
			expect(await gymMLM.userToReferrer(await gymMLM.idToAddress(1))).to.equal(deployer.address);
			expect(await gymMLM.currentId()).to.equal(2);
			for (let i = 0; i < defs.GymMLM_DIRECT_REFERRAL_BONUSES_LENGTH; i++) {
				expect(await gymMLM.directReferralBonuses(i)).to.equal(defs.GymMLM_DIRECT_REFERRAL_BONUSES[i]);
				expect(await gymMLM.levels(i)).to.equal(defs.GymMLM_LEVELS[i]);
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

			await wantToken.connect(accounts.vzgo).approve(gymVaultsBank.address, depositAmount);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: `${depositAmount}`,
				referrerId: `${referrerId}`,
				caller: "vzgo"
			});

			expect(await gymMLM.userToReferrer(await gymMLM.idToAddress(currentId))).to.equal(
				await gymMLM.idToAddress(referrerId)
			);
		});

		it("Should revert with 'GymMLM::referrer is zero address': ", async function () {
			await wantToken.connect(vzgo).approve(gymVaultsBank.address, depositAmount);
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
			let ownerBal = (await wantToken.balanceOf(owner.address)).sub(depositAmount);

			for (const signer in accounts) {
				if (signer === "deployer") {
					continue;
				}

				await wantToken.connect(accounts[signer]).approve(gymVaultsBank.address, depositAmount);

				await run("gymVaultsBank:deposit", {
					pid: "1",
					wantAmt: `${depositAmount}`,
					referrerId: (await gymMLM.addressToId(accounts[prevSigner].address)).toString(),
					caller: signer
				});

				if (index === 0) {
					prevSigner = signer;
					prevSignerBal = await wantToken.balanceOf(accounts[signer].address);
					index++;
					continue;
				}

				const levelBNB = await gymMLM.levels(index > 15 ? (index = 14) : index - 1);
				const investAmount = await gymMLM.investment(accounts[signer].address);

				if (index === 16) {
					expect((await wantToken.balanceOf(owner.address)).sub(ownerBal)).to.equal(0);
				} else {
					if (investAmount.lt(levelBNB)) {
						expect((await wantToken.balanceOf(owner.address)).sub(ownerBal)).to.equal(0);
					} else {
						expect((await wantToken.balanceOf(owner.address)).sub(ownerBal)).to.equal(
							Math.floor((depositAmount * gymMLMBonuses[index - 1]) / 100)
						);
					}
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
			let deployerAmtBefore = await wantToken.balanceOf(accounts.deployer.address);
			await wantToken.connect(accounts.vzgo).approve(gymVaultsBank.address, depositAmount);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: `${depositAmount}`,
				referrerId: (await gymMLM.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			expect((await wantToken.balanceOf(deployer.address)).sub(deployerAmtBefore)).to.equal(gymMLMAmount);
			deployerAmtBefore = await wantToken.balanceOf(deployer.address);

			await wantToken.connect(accounts.grno).approve(gymVaultsBank.address, depositAmount);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: `${depositAmount}`,
				referrerId: (await gymMLM.addressToId(accounts.vzgo.address)).toString(),
				caller: "grno"
			});

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

			for (const signer in accounts) {
				if (signer === "deployer") {
					continue;
				}
				const deposit = await run("gymVaultsBank:deposit", {
					pid: "0",
					wantAmt: "0",
					referrerId: (await gymMLM.addressToId(accounts[prevSigner].address)).toString(),
					caller: signer,
					bnbAmount: `${depositAmount}`
				});

				if (index === 0) {
					prevSigner = signer;
					prevSignerBal = await accounts[signer].getBalance();
					ownerBal = ownerBal.sub((await deposit.tx.wait()).gasUsed * deposit.tx.gasPrice);
					index++;
					continue;
				}

				const levelBNB = await gymMLM.levels(index > 15 ? (index = 14) : index - 1);
				const investAmount = await gymMLM.investment(accounts[signer].address);

				if (index === 16) {
					expect((await owner.getBalance()).sub(ownerBal)).to.equal(0);
				} else {
					if (investAmount.lt(levelBNB)) {
						expect((await owner.getBalance()).sub(ownerBal)).to.equal(0);
					} else {
						expect((await owner.getBalance()).sub(ownerBal)).to.equal(
							Math.floor((depositAmount * gymMLMBonuses[index - 1]) / 100)
						);
					}
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
			let deployerAmtBefore = await accounts.deployer.getBalance();
			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await gymMLM.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: `${depositAmount}`
			});

			expect((await accounts.deployer.getBalance()).sub(deployerAmtBefore)).to.equal(gymMLMAmount);
			deployerAmtBefore = await accounts.deployer.getBalance();
			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await gymMLM.addressToId(accounts.vzgo.address)).toString(),
				caller: "grno",
				bnbAmount: `${depositAmount}`
			});

			expect((await deployer.getBalance()).sub(deployerAmtBefore)).to.equal(
				gymMLMAmount - (depositAmount * gymMLMBonuses[0]) / 100
			);
		});
	});
});
