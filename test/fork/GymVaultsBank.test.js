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

describe("GymVaultsBank contract: ", function () {
	let accounts, deployer, owner, caller, holder, vzgo, grno;
	let wantToken1, wantToken2, gymToken, relationship, farming, buyBack, gymVaultsBank, WBNB, earnToken;
	// eslint-disable-next-line no-unused-vars
	let strategy, strategy1, strategy2, strategy3, routerMock, snapshotId;
	const startBlock = 200;
	before("Before All: ", async function () {
		await fixture("Fork");
		accounts = await getNamedSigners();
		({ deployer, owner, caller, holder, vzgo, grno } = accounts);
		wantToken1 = await getContract("WantToken1", caller);
		wantToken2 = await getContract("WantToken2", caller);
		gymToken = await getContract("GymToken", caller);
		relationship = await getContract("GymMLM", caller);
		farming = await getContract("GymFarming", deployer);
		await farming.connect(deployer).add(30, gymToken.address, false);
		buyBack = await getContract("BuyBack", caller);
		gymVaultsBank = await getContract("GymVaultsBank", deployer);
		WBNB = await getContract("WBNBMock", caller);
		earnToken = await getContract("EarnToken", caller);
		strategy1 = await getContract("StrategyMock1", deployer);
		strategy2 = await getContract("StrategyMock2", deployer);
		strategy = await getContract("StrategyMock", caller);
		routerMock = await getContract("RouterMock", caller);

		await run("gymMLM:setBankAddress", {
			bankAddress: gymVaultsBank.address,
			caller: "deployer"
		});

		await run("gymVaultsBank:setFarmingAddress", {
			farmingAddress: farming.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:setTreasuryAddress", {
			treasuryAddress: owner.address,
			caller: "deployer"
		});
		await gymVaultsBank.connect(deployer).setWithdrawFee(1000);
		await run("gymVaultsBank:setWithdrawFee", {
			withdrawFee: "1000",
			caller: "deployer"
		});
		await WBNB.connect(deployer).deposit({
			value: parseEther("10")
		});
		await gymToken.connect(holder).transfer(gymVaultsBank.address, parseEther("10000"));
		await gymToken.connect(holder).delegate(buyBack.address);
		await WBNB.connect(deployer).transfer(routerMock.address, parseEther("10"));
		await deployer.sendTransaction({
			value: parseEther("5000"),
			to: routerMock.address
		});
		await gymToken.connect(holder).approve(routerMock.address, parseEther("1000"));
		await run("gymVaultsBank:add", {
			want: WBNB.address,
			allocPoint: "30",
			withUpdate: "false",
			strategy: strategy.address,
			caller: "deployer"
		});

		strategy3 = await getContract("StrategyMock3", deployer);

		await wantToken2.connect(deployer).transfer(vzgo.address, testVars.WANTTOKEN_AMOUNT / 4);
		await wantToken2.connect(deployer).transfer(grno.address, testVars.WANTTOKEN_AMOUNT / 4);
		await wantToken2.connect(deployer).transfer(routerMock.address, testVars.WANTTOKEN_AMOUNT / 4);

		await wantToken1.connect(deployer).transfer(grno.address, testVars.WANTTOKEN_AMOUNT / 2);
		await wantToken1.connect(deployer).transfer(vzgo.address, testVars.WANTTOKEN_AMOUNT / 2);
		await gymToken.connect(holder).transfer(gymVaultsBank.address, 2000);
		await gymToken.connect(holder).transfer(routerMock.address, parseEther(testVars.AMOUNT.toString()));
		await earnToken.connect(deployer).transfer(gymVaultsBank.address, 5000);
	});

	describe("Claim and deposit in farming:", function () {
		// fork
		before("Before: ", async function () {
			snapshotId = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotId]
			});
		});

		it("Should deposit in gymVaultsbank, claim rewards and deposit in Farming", async function () {
			await advanceBlockTo((await getBlockNumber()) + startBlock);

			await run("gymVaultsBank:add", {
				want: wantToken2.address,
				allocPoint: "30",
				withUpdate: "false",
				strategy: strategy2.address,
				caller: "deployer"
			});
			await wantToken2.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo"
			});

			await advanceBlockTo((await getBlockNumber()) + 150);
			// await gymVaultsBank.connect(vzgo).claimAndDeposit(1, 0, 0, 0, new Date().getTime() + 20);
			await run("gymVaultsBank:claimAndDeposit", {
				pid: "1",
				caller: "vzgo"
			});
			expect((await farming.userInfo(0, vzgo.address)).amount).to.equal(variables.ROUTER_MOCK_RETURN_AMOUNT);
		});
	});
});
