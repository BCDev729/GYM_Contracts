const { expect } = require("chai");
const {
	deployments: { fixture },
	ethers: { getContract, getNamedSigners }
} = require("hardhat");
const variables = require("../../utils/constants/solpp")("hardhat");

describe("BuyBack contract: ", function () {
	let accounts, deployer, caller, holder;
	let gymToken, gymVaultsBank, buyBack, relationship, wantToken, wBNBMock, strategy, strategyAlpaca, routerMock;
	
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
		await relationship.connect(deployer).setBankAddress(gymVaultsBank.address);

		wantToken = await getContract("WantToken1", caller);
		wBNBMock = await getContract("WBNBMock", caller);
		strategy = await getContract("StrategyMock1", caller);
		strategyAlpaca = await getContract("StrategyMock", caller);
		routerMock = await getContract("RouterMock", caller);

		await gymToken.connect(holder).delegate(buyBack.address);

		await gymVaultsBank.connect(deployer).setTreasuryAddress(deployer.address);

		await wantToken.connect(deployer).transfer(routerMock.address, transferAmount);
		await wantToken.connect(deployer).transfer(holder.address, transferAmount);

		await gymToken.connect(holder).transfer(gymVaultsBank.address, 100000);
		await gymToken.connect(holder).transfer(routerMock.address, 100000);

		await gymVaultsBank.connect(deployer).add(wBNBMock.address, 20, false, strategyAlpaca.address);
		await gymVaultsBank.connect(deployer).add(wantToken.address, 20, true, strategy.address);
	});

	it("Should buy and burn gym tokens for BNB transactions: ", async function () {
		const gymTotalSupplyBefore = await gymToken.totalSupply();

		await gymVaultsBank
			.connect(holder)
			.deposit(0, 0, relationship.addressToId(deployer.address), 0, new Date().getTime() + 20, {
				value: transactionAmount
			});

		expect(gymTotalSupplyBefore.sub(await gymToken.totalSupply())).to.equal(
			(transactionAmount * buyBackPercent) / 100
		);
	});

	it("Should buy and burn gym tokens for tokens transactions: ", async function () {
		const gymTotalSupplyBefore = await gymToken.totalSupply();

		await wantToken.connect(holder).approve(gymVaultsBank.address, transactionAmount);
		await gymVaultsBank.connect(holder).deposit(1, transactionAmount, 1, 0, new Date().getTime() + 20);

		expect(gymTotalSupplyBefore.sub(await gymToken.totalSupply())).to.equal(
			(transactionAmount * buyBackPercent) / 100
		);
	});
});
