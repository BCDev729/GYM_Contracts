const { expect } = require("chai");
const {
	deployments: { fixture },
	ethers: { getContract, getNamedSigners }
} = require("hardhat");
const variables = require("../../utils/constants/solpp")("hardhat");

let accounts, deployer, caller, holder;

const transactionAmount = 500;
const transferAmount = 5000;
const buyBackPercent = variables.GymVaultsBank_BUY_AND_BURN;

describe("BuyBack contract: ", function () {
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({ deployer, caller, holder } = accounts);
		await fixture("Hardhat");
		this.gymToken = await getContract("GymToken", caller);
		this.gymVaultsBank = await getContract("GymVaultsBank", caller);
		this.buyBack = await getContract("BuyBack", caller);
		this.relationship = await getContract("GymMLM", caller);
		await this.relationship.connect(deployer).setBankAddress(this.gymVaultsBank.address);

		this.wantToken = await getContract("WantToken1", caller);
		this.wBNBMock = await getContract("WBNBMock", caller);
		this.strategy = await getContract("StrategyMock1", caller);
		this.strategyAlpaca = await getContract("StrategyMock", caller);
		this.routerMock = await getContract("RouterMock", caller);

		await this.gymToken.connect(holder).delegate(this.buyBack.address);

		await this.gymVaultsBank.connect(deployer).setTreasuryAddress(deployer.address);

		await this.wantToken.connect(deployer).transfer(this.routerMock.address, transferAmount);
		await this.wantToken.connect(deployer).transfer(holder.address, transferAmount);

		await this.gymToken.connect(holder).transfer(this.gymVaultsBank.address, 100000);
		await this.gymToken.connect(holder).transfer(this.routerMock.address, 100000);

		await this.gymVaultsBank.connect(deployer).add(this.wBNBMock.address, 20, false, this.strategyAlpaca.address);
		await this.gymVaultsBank.connect(deployer).add(this.wantToken.address, 20, true, this.strategy.address);
	});

	it("Should buy and burn gym tokens for BNB transactions: ", async function () {
		const gymTotalSupplyBefore = await this.gymToken.totalSupply();

		await this.gymVaultsBank
			.connect(holder)
			.deposit(0, 0, this.relationship.addressToId(deployer.address), 0, new Date().getTime() + 20, {
				value: transactionAmount
			});

		expect(gymTotalSupplyBefore.sub(await this.gymToken.totalSupply())).to.equal(
			(transactionAmount * buyBackPercent) / 100
		);
	});

	it("Should buy and burn gym tokens for tokens transactions: ", async function () {
		const gymTotalSupplyBefore = await this.gymToken.totalSupply();

		await this.wantToken.connect(holder).approve(this.gymVaultsBank.address, transactionAmount);
		await this.gymVaultsBank.connect(holder).deposit(1, transactionAmount, 1, 0, new Date().getTime() + 20);

		expect(gymTotalSupplyBefore.sub(await this.gymToken.totalSupply())).to.equal(
			(transactionAmount * buyBackPercent) / 100
		);
	});
});
