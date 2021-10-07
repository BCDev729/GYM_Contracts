const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: {
		getNamedSigners,
		getContract,
		utils: { parseEther },
		provider: { getBlockNumber }
	},
	run
} = require("hardhat");

const { advanceBlockTo } = require("../utilities/time");
const testVars = require("../utilities/testVariables.json");
const variables = require("../../utils/constants/solpp")("fork");

let accounts, deployer, owner, caller, holder, vzgo, grno;

describe("GymVaultsBank contract: ", function () {
	before("Before All: ", async function () {
		await fixture();
		accounts = await getNamedSigners();
		({ deployer, owner, caller, holder, vzgo, grno } = accounts);
		this.wantToken1 = await getContract("WantToken1", caller);
		this.wantToken2 = await getContract("WantToken2", caller);
		this.gymToken = await getContract("GymToken", caller);
		this.relationship = await getContract("GymMLM", caller);
		this.farming = await getContract("GymFarming", deployer);
		await this.farming.connect(deployer).add(30, this.gymToken.address, false);
		this.buyBack = await getContract("BuyBack", caller);
		this.gymVaultsBank = await getContract("GymVaultsBank", deployer);
		this.WBNB = await getContract("WBNBMock", caller);
		this.earnToken = await getContract("EarnToken", caller);
		this.strategy1 = await getContract("StrategyMock1", deployer);
		this.strategy2 = await getContract("StrategyMock2", deployer);
		this.strategy = await getContract("StrategyMock", caller);
		this.routerMock = await getContract("RouterMock", caller);

		await run("gymMLM:setBankAddress", {
			bankAddress: this.gymVaultsBank.address,
			caller: "deployer"
		});

		await run("gymVaultsBank:setFarmingAddress", {
			farmingAddress: this.farming.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:setTreasuryAddress", {
			treasuryAddress: owner.address,
			caller: "deployer"
		});
		await this.gymVaultsBank.connect(deployer).setWithdrawFee(1000);
		await run("gymVaultsBank:setWithdrawFee", {
			withdrawFee: "1000",
			caller: "deployer"
		});
		await this.WBNB.connect(deployer).deposit({
			value: parseEther("10")
		});
		await this.gymToken.connect(holder).transfer(this.gymVaultsBank.address, parseEther("10000"));
		await this.gymToken.connect(holder).delegate(this.buyBack.address);
		await this.WBNB.connect(deployer).transfer(this.routerMock.address, parseEther("10"));
		await deployer.sendTransaction({
			value: parseEther("5000"),
			to: this.routerMock.address
		});
		await this.gymToken.connect(holder).approve(this.routerMock.address, parseEther("1000"));
		await run("gymVaultsBank:add", {
			want: this.WBNB.address,
			allocPoint: "30",
			withUpdate: "false",
			strategy: this.strategy.address,
			caller: "deployer"
		});

		this.strategy3 = await getContract("StrategyMock3", deployer);

		await this.wantToken2.connect(deployer).transfer(vzgo.address, testVars.WANTTOKEN_AMOUNT / 4);
		await this.wantToken2.connect(deployer).transfer(grno.address, testVars.WANTTOKEN_AMOUNT / 4);
		await this.wantToken2.connect(deployer).transfer(this.routerMock.address, testVars.WANTTOKEN_AMOUNT / 4);

		await this.wantToken1.connect(deployer).transfer(grno.address, testVars.WANTTOKEN_AMOUNT / 2);
		await this.wantToken1.connect(deployer).transfer(vzgo.address, testVars.WANTTOKEN_AMOUNT / 2);
		await this.gymToken.connect(holder).transfer(this.gymVaultsBank.address, 2000);
		await this.gymToken.connect(holder).transfer(this.routerMock.address, parseEther(testVars.AMOUNT.toString()));
		await this.earnToken.connect(deployer).transfer(this.gymVaultsBank.address, 5000);
	});

	describe("Claim and deposit in farming:", function () {
		// fork
		before("Before: ", async function () {
			this.snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotId]
			});
		});

		it("Should deposit in gymVaultsbank, claim rewards and deposit in Farming", async function () {
			await advanceBlockTo((await getBlockNumber()) + this.deploymentArgs.startBlock);

			await run("gymVaultsBank:add", {
				want: this.wantToken2.address,
				allocPoint: "30",
				withUpdate: "false",
				strategy: this.strategy2.address,
				caller: "deployer"
			});
			await this.wantToken2.connect(vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});

			await advanceBlockTo((await getBlockNumber()) + 150);
			// await this.gymVaultsBank.connect(vzgo).claimAndDeposit(1, 0, 0, 0, new Date().getTime() + 20);
			await run("gymVaultsBank:claimAndDeposit", {
				pid: "1",
				caller: "vzgo"
			});
			expect((await this.farming.userInfo(0, vzgo.address)).amount).to.equal(variables.ROUTER_MOCK_RETURN_AMOUNT);
		});
	});
});
