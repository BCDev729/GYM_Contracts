const { expect } = require("chai");
const {
	deployments: { fixture },
	ethers: { getContract, getNamedSigners },
	run
} = require("hardhat");
const variables = require("../../utils/constants/solpp")("hardhat");

let accounts;

const transactionAmount = 500;
const transferAmount = 5000;
const buyBackPercent = variables.GymVaultsBank_BUY_AND_BURN;

describe("BuyBack contract: ", function () {
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		await fixture();
		this.gymToken = await getContract("GymToken", accounts.caller);
		this.gymVaultsBank = await getContract("GymVaultsBank", accounts.caller);
		this.buyBack = await getContract("BuyBack", accounts.caller);
		this.relationship = await getContract("GymMLM", accounts.caller);
		await this.relationship.connect(accounts.deployer).setBankAddress(this.gymVaultsBank.address);

		this.wantToken = await getContract("WantToken1", accounts.caller);
		this.wBNBMock = await getContract("WBNBMock", accounts.caller);
		this.strategy = await getContract("StrategyMock1", accounts.caller);
		this.strategyAlpaca = await getContract("StrategyMock", accounts.caller);
		this.routerMock = await getContract("RouterMock", accounts.caller);

		await this.gymToken.connect(accounts.holder).delegate(this.buyBack.address);

		await this.gymVaultsBank.connect(accounts.deployer).setTreasuryAddress(accounts.deployer.address);

		await this.wantToken.connect(accounts.deployer).transfer(this.routerMock.address, transferAmount);
		await this.wantToken.connect(accounts.deployer).transfer(accounts.holder.address, transferAmount);

		await this.gymToken.connect(accounts.holder).transfer(this.gymVaultsBank.address, 100000);
		await this.gymToken.connect(accounts.holder).transfer(this.routerMock.address, 100000);

		await run("gymVaultsBank:add", {
			want: this.wBNBMock.address,
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

	describe("BuyAndBurnToken function: ", function () {
		it("Should buy and burn gym tokens for BNB transactions: ", async function () {
			const gymTotalSupplyBefore = await this.gymToken.totalSupply();
			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: "0",
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "holder",
				bnbAmount: `${transactionAmount}`
			});

			expect(gymTotalSupplyBefore.sub(await this.gymToken.totalSupply())).to.equal(
				(transactionAmount * buyBackPercent) / 100
			);
		});

		it("Should buy and burn gym tokens for tokens transactions: ", async function () {
			const gymTotalSupplyBefore = await this.gymToken.totalSupply();

			await this.wantToken.connect(accounts.holder).approve(this.gymVaultsBank.address, transactionAmount);
			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: `${transactionAmount}`,
				referrerId: "1",
				caller: "holder"
			});

			expect(gymTotalSupplyBefore.sub(await this.gymToken.totalSupply())).to.equal(
				(transactionAmount * buyBackPercent) / 100
			);
		});
	});
});
