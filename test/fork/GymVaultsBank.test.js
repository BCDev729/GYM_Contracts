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

let accounts;

describe("GymVaultsBank contract: ", function () {
	before("Before All: ", async function () {
		await fixture();
		accounts = await getNamedSigners();
		this.wantToken1 = await getContract("WantToken1", accounts.caller);
		this.wantToken2 = await getContract("WantToken2", accounts.caller);
		this.gymToken = await getContract("GymToken", accounts.caller);
		this.relationship = await getContract("GymMLM", accounts.caller);
		this.farming = await getContract("GymFarming", accounts.deployer);

		await this.farming.connect(accounts.deployer).add(30, this.gymToken.address, false);
		this.buyBack = await getContract("BuyBack", accounts.caller);
		this.gymVaultsBank = await getContract("GymVaultsBank", accounts.deployer);
		this.WBNB = await getContract("WBNBMock", accounts.caller);
		this.earnToken = await getContract("EarnToken", accounts.caller);
		this.strategy1 = await getContract("StrategyMock1", accounts.deployer);
		this.strategy2 = await getContract("StrategyMock2", accounts.deployer);
		this.strategy = await getContract("StrategyMock", accounts.caller);
		this.routerMock = await getContract("RouterMock", accounts.caller);

		await run("gymMLM:setBankAddress", {
			bankAddress: this.gymVaultsBank.address,
			caller: "deployer"
		});

		await run("gymVaultsBank:setFarmingAddress", {
			farmingAddress: this.farming.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:setTreasuryAddress", {
			treasuryAddress: accounts.owner.address,
			caller: "deployer"
		});
		await this.gymVaultsBank.connect(accounts.deployer).setWithdrawFee(1000);
		await run("gymVaultsBank:setWithdrawFee", {
			withdrawFee: "1000",
			caller: "deployer"
		});
		await this.WBNB.connect(accounts.deployer).deposit({
			value: parseEther("10")
		});
		await this.gymToken.connect(accounts.holder).transfer(this.gymVaultsBank.address, parseEther("10000"));
		await this.gymToken.connect(accounts.holder).delegate(this.buyBack.address);
		await this.WBNB.connect(accounts.deployer).transfer(this.routerMock.address, parseEther("10"));
		await accounts.deployer.sendTransaction({
			value: parseEther("5000"),
			to: this.routerMock.address
		});
		await this.gymToken.connect(accounts.holder).approve(this.routerMock.address, parseEther("1000"));
		await run("gymVaultsBank:add", {
			want: this.WBNB.address,
			allocPoint: "30",
			withUpdate: "false",
			strategy: this.strategy.address,
			caller: "deployer"
		});

		this.strategy3 = await getContract("StrategyMock3", accounts.deployer);

		await this.wantToken2.connect(accounts.deployer).transfer(accounts.vzgo.address, testVars.WANTTOKEN_AMOUNT / 4);
		await this.wantToken2.connect(accounts.deployer).transfer(accounts.grno.address, testVars.WANTTOKEN_AMOUNT / 4);
		await this.wantToken2
			.connect(accounts.deployer)
			.transfer(this.routerMock.address, testVars.WANTTOKEN_AMOUNT / 4);

		await this.wantToken1.connect(accounts.deployer).transfer(accounts.grno.address, testVars.WANTTOKEN_AMOUNT / 2);
		await this.wantToken1.connect(accounts.deployer).transfer(accounts.vzgo.address, testVars.WANTTOKEN_AMOUNT / 2);
		await this.gymToken.connect(accounts.holder).transfer(this.gymVaultsBank.address, 2000);
		await this.gymToken
			.connect(accounts.holder)
			.transfer(this.routerMock.address, parseEther(testVars.AMOUNT.toString()));
		await this.earnToken.connect(accounts.deployer).transfer(this.gymVaultsBank.address, 5000);
	});

	xdescribe("Claim and deposit in farming:", function () {
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
			await this.wantToken2.connect(accounts.vzgo).approve(this.gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await this.relationship.addressToId(accounts.deployer.address)).toString(),
				caller: "vzgo"
			});

			await advanceBlockTo((await getBlockNumber()) + 150);
			// await this.gymVaultsBank.connect(accounts.vzgo).claimAndDeposit(1, 0, 0, 0, new Date().getTime() + 20);
			await run("gymVaultsBank:claimAndDeposit", {
				pid: "1",
				caller: "vzgo"
			});
			expect((await this.farming.userInfo(0, accounts.vzgo.address)).amount).to.equal(
				variables.ROUTER_MOCK_RETURN_AMOUNT
			);
		});
	});
});
