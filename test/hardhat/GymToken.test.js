const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: { getContract, getNamedSigners, BigNumber }
} = require("hardhat");
const testVars = require("./../utilities/testVariables.json");
const variables = require("../../utils/constants/solpp")("hardhat");

let accounts, snapshotId, caller, holder;

describe("GymToken contract: ", function () {
	before("Before All: ", async function () {
		await fixture();

		accounts = await getNamedSigners();
		({ caller, holder } = accounts);
		this.gymToken = await getContract("GymToken", caller);
		await this.gymToken.connect(caller).delegate(caller.address);
		await this.gymToken.connect(holder).delegate(holder.address);
	});

	describe("Initialization: ", function () {
		beforeEach("BeforeEach: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("AfterEach tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});

		it("Should initialize with correct values: ", async function () {
			expect("\"" + (await this.gymToken.name()) + "\"").to.equal(variables.GymToken_NAME);
			expect("\"" + (await this.gymToken.symbol()) + "\"").to.equal(variables.GymToken_SYMBOL);
			expect(await this.gymToken.decimals()).to.equal(variables.GymToken_DECIMALS);
			expect(await this.gymToken.totalSupply()).to.equal(variables.GymToken_TOTAL_SUPPLY);
		});
	});

	describe("Burn function: ", function () {
		beforeEach("BeforeEach: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("AfterEach tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});

		it("Should burn gym tokens: ", async function () {
			await this.gymToken.connect(holder).transfer(caller.address, testVars.TX_AMOUNT);

			const callerBal = await this.gymToken.balanceOf(caller.address);
			const totalSupply = await this.gymToken.totalSupply();
			await this.gymToken.connect(caller).burn(testVars.TX_AMOUNT);

			expect(await this.gymToken.balanceOf(caller.address)).to.equal(callerBal - testVars.TX_AMOUNT);
			expect(await this.gymToken.totalSupply()).to.equal(BigNumber.from(totalSupply).sub(testVars.TX_AMOUNT));
		});
	});

	describe("BurnFrom function: ", function () {
		beforeEach("BeforeEach: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		afterEach("AfterEach tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});

		it("Should burn gym tokens: ", async function () {
			const holderBal = await this.gymToken.balanceOf(holder.address);
			const totalSupply = await this.gymToken.totalSupply();

			await this.gymToken.connect(holder).approve(caller.address, testVars.TX_AMOUNT);
			await this.gymToken.burnFrom(holder.address, testVars.TX_AMOUNT);

			expect(await this.gymToken.balanceOf(holder.address)).to.equal(
				BigNumber.from(holderBal).sub(testVars.TX_AMOUNT)
			);
			expect(await this.gymToken.totalSupply()).to.equal(BigNumber.from(totalSupply).sub(testVars.TX_AMOUNT));
		});

		it("Should revert with 'GymToken: burn amount exceeds allowance': ", async function () {
			await this.gymToken.connect(holder).approve(caller.address, testVars.TX_AMOUNT);

			await expect(this.gymToken.burnFrom(holder.address, testVars.TX_AMOUNT * 2)).to.be.revertedWith(
				"GymToken: burn amount exceeds allowance"
			);
		});
	});
});
