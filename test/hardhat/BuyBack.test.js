const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: { getContract, getNamedSigners },
	run,
} = require("hardhat");
const variables = require("../../utils/constants/solpp")("hardhat");

describe("BuyBack contract: ", function () {
	let accounts, deployer, caller, holder;
	let gymToken, snapshotStart, gymVaultsBank, buyBack, relationship, wantToken, wBNBMock, strategy, strategyAlpaca, routerMock;

	const transactionAmount = 500;
	const transferAmount = 5000;
	const buyBackPercent = variables.GymVaultsBank_BUY_AND_BURN;

	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({ deployer, caller, holder } = accounts);
		await fixture("Hardhat");
		gymToken = await getContract("GymToken", caller);
		gymVaultsBank = await getContract("GymVaultsBank", caller);
		buyBack = await getContract("BuyBack", caller);
		relationship = await getContract("GymMLM", caller);
		await run("gymMLM:setBankAddress", {
			bankAddress: gymVaultsBank.address,
			caller: "deployer"
		});

		wantToken = await getContract("WantToken1", caller);
		wBNBMock = await getContract("WBNBMock", caller);
		strategy = await getContract("StrategyMock1", caller);
		strategyAlpaca = await getContract("StrategyMock", caller);
		routerMock = await getContract("RouterMock", caller);

		await gymToken.connect(holder).delegate(buyBack.address);

		await run("gymVaultsBank:setTreasuryAddress", {
			treasuryAddress: deployer.address,
			caller: "deployer"
		});


		await wantToken.connect(deployer).transfer(routerMock.address, transferAmount);
		await wantToken.connect(deployer).transfer(holder.address, transferAmount);

		await gymToken.connect(holder).transfer(gymVaultsBank.address, 100000);
		await gymToken.connect(holder).transfer(routerMock.address, 100000);

		await run("gymVaultsBank:add", {
			want: wBNBMock.address,
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
	});

	describe("Transfer: ", function () {
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

		it("Should transfer wantToken and gymToken", async function () {
			await gymToken.connect(holder).delegate(buyBack.address);


			await expect(() => wantToken.connect(deployer).transfer(routerMock.address, transferAmount))
				.to.changeTokenBalance(wantToken, routerMock, transferAmount);

			await expect(() => wantToken.connect(deployer).transfer(holder.address, transferAmount))
				.to.changeTokenBalance(wantToken, holder, transferAmount);



			await expect(() => gymToken.connect(holder).transfer(gymVaultsBank.address, 10000))
				.to.changeTokenBalance(gymToken, gymVaultsBank, 10000);

			await expect(() => gymToken.connect(holder).transfer(routerMock.address, 10000))
				.to.changeTokenBalance(gymToken, routerMock, 10000);
		});
	});

	describe("BuyAndBurnToken function: ", function () {
		it("Should buy and burn gym tokens for BNB transactions: ", async function () {
			const gymTotalSupplyBefore = await gymToken.totalSupply();
			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "holder",
				bnbAmount: `${transactionAmount}`
			});

			expect(gymTotalSupplyBefore.sub(await gymToken.totalSupply())).to.equal(
				(transactionAmount * buyBackPercent) / 100
			);
		});

		it("Should buy and burn gym tokens for tokens transactions: ", async function () {
			const gymTotalSupplyBefore = await gymToken.totalSupply();

			await wantToken.connect(accounts.holder).approve(gymVaultsBank.address, transactionAmount);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: `${transactionAmount}`,
				referrerId: "1",
				caller: "holder"
			});

			expect(gymTotalSupplyBefore.sub(await gymToken.totalSupply())).to.equal(
				(transactionAmount * buyBackPercent) / 100
			);
		});
	});
});
