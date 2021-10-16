const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: {
		getContract,
		getNamedSigners,
		BigNumber,
		constants: { AddressZero },
	},
} = require("hardhat");
const testVars = require("./../../utils/constants/data/testVariables.json");
const variables = require("../../utils/constants/solpp")("hardhat");

describe("GymToken contract: ", function () {
	let accounts, snapshotId, caller, holder;
	let gymToken;
	before("Before All: ", async function () {
		await fixture("Hardhat");

		accounts = await getNamedSigners();
		({ caller, holder } = accounts);
		gymToken = await getContract("GymToken", caller);
		await gymToken.connect(caller).delegate(caller.address);
		await gymToken.connect(holder).delegate(holder.address);
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
			expect("\"" + (await gymToken.name()) + "\"").to.equal(variables.GymToken_NAME);
			expect("\"" + (await gymToken.symbol()) + "\"").to.equal(variables.GymToken_SYMBOL);
			expect(await gymToken.decimals()).to.equal(variables.GymToken_DECIMALS);
			expect(await gymToken.totalSupply()).to.equal(variables.GymToken_TOTAL_SUPPLY);
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
			await gymToken.connect(holder).transfer(caller.address, testVars.TX_AMOUNT);

			const callerBal = await gymToken.balanceOf(caller.address);
			const totalSupply = await gymToken.totalSupply();
			await gymToken.connect(caller).burn(testVars.TX_AMOUNT);

			expect(await gymToken.balanceOf(caller.address)).to.equal(callerBal - testVars.TX_AMOUNT);
			expect(await gymToken.totalSupply()).to.equal(BigNumber.from(totalSupply).sub(testVars.TX_AMOUNT));
		});

		it("Emit", async function () {
			const srcRepNum = await gymToken.numCheckpoints(holder.address);
			const checkpoint1Votes = (await gymToken.checkpoints(holder.address, srcRepNum - 1)).votes;
			const oldVotes = srcRepNum > 0 ? checkpoint1Votes : 0;
			const amnt = BigNumber.from(testVars.TX_AMOUNT);
			const newVotes = oldVotes.sub(amnt.mul(10**2));

			await expect(gymToken.connect(holder).transfer(caller.address, amnt.mul(10**2)))
				.to
				.emit(gymToken, "DelegateVotesChanged")
				.withArgs(holder.address, oldVotes, newVotes);
		});

		it("Should emit Transfer event with correct args", async function () {
			await gymToken.connect(holder).transfer(caller.address, testVars.TX_AMOUNT);
			await expect(gymToken.connect(caller).burn(testVars.TX_AMOUNT))
				.to
				.emit(gymToken, "Transfer")
				.withArgs(caller.address, AddressZero, testVars.TX_AMOUNT);
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
			const holderBal = await gymToken.balanceOf(holder.address);
			const totalSupply = await gymToken.totalSupply();

			await gymToken.connect(holder).approve(caller.address, testVars.TX_AMOUNT);
			await gymToken.burnFrom(holder.address, testVars.TX_AMOUNT);

			expect(await gymToken.balanceOf(holder.address)).to.equal(
				BigNumber.from(holderBal).sub(testVars.TX_AMOUNT)
			);
			expect(await gymToken.totalSupply()).to.equal(BigNumber.from(totalSupply).sub(testVars.TX_AMOUNT));
		});

		it("Should revert with 'GymToken: burn amount exceeds allowance': ", async function () {
			await gymToken.connect(holder).approve(caller.address, testVars.TX_AMOUNT);

			await expect(gymToken.burnFrom(holder.address, testVars.TX_AMOUNT * 2)).to.be.revertedWith(
				"GymToken: burn amount exceeds allowance"
			);
		});
	});

	describe("Approve", function () {
		it("Should emit Approval event with correct args", async function () {
			const amount = 500;
			await gymToken.connect(holder).transfer(caller.address, 1000);
			await expect(gymToken.connect(caller).approve(holder.address, amount))
				.to
				.emit(gymToken, "Approval")
				.withArgs(caller.address, holder.address, amount);

		});
	});

	describe("Delegate", function () {
		it("Should emit DelegateChanged event with correct args", async function () {
			const delegator = caller.address;
			const currentDelegate = await gymToken.delegates(delegator);
			await expect(gymToken.connect(caller).delegate(caller.address))
				.to
				.emit(gymToken, "DelegateChanged")
				.withArgs(caller.address, currentDelegate, caller.address);
		});
	});
});
