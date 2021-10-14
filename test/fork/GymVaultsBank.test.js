const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: {
		getNamedSigners,
		getContract,
		getContractAt,
		utils: { parseEther },
		provider: { getBlockNumber }
	},
	run
} = require("hardhat");

const { advanceBlockTo } = require("../utilities/time");
const testVars = require("../utilities/testVariables.json");
const variables = require("../../utils/constants/solpp")("fork");
const farmingData = require("../../utils/constants/data/fork/GymFarming.json");
describe("GymVaultsBank contract: ", function () {
	let accounts, deployer, owner, caller, holder, vzgo;
	// grno;
	let gymToken,
		relationship,
		farming,
		buyBack,
		gymVaultsBank,
		WBNB,
		lpToken,
		liquidityProvider,
		factory,
		lp,
		balanceLp,
		pending;
	// eslint-disable-next-line no-unused-vars
	let strategy, strategy1, strategy2, router, snapshotId, snapshot;
	const startBlock = 200;
	const deadline = new Date().getTime() + 10;
	before("Before All: ", async function () {
		await fixture("Fork");
		accounts = await getNamedSigners();
		({ deployer, owner, caller, holder, vzgo } = accounts);
		// wantToken2 = await getContract("WantToken2", caller);
		// wantToken2 = await getContractAt("GymToken", "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f");
		gymToken = await getContract("GymToken", caller);
		relationship = await getContract("GymMLM", caller);
		console.log("🚀 ~ file: GymVaultsBank.test.js ~ line 48 ~ relationship", relationship.address);
		farming = await getContract("GymFarming", deployer);
		liquidityProvider = await getContractAt("ILiquidityProvider", deployer.address);
		// await farming.connect(deployer).add(30, gymToken.address, false);
		await run("farming:add", {
			allocPoint: "30",
			lpToken: gymToken.address,
			withUpdate: "false"
		});
		buyBack = await getContract("BuyBack", caller);
		gymVaultsBank = await getContract("GymVaultsBank", deployer);
		WBNB = await getContractAt("IWETH", variables.WBNB_TOKEN);
		router = await getContractAt("IPancakeRouter02", variables.ROUTER);
		factory = await router.factory();
		factory = await getContractAt("IPancakeFactory", factory);
		// WBNB = await getContract("WBNBMock", caller);

		// earnToken = await getContractAt("GymToken", variables.ALPACA_TOKEN);
		// earnToken = await getContract("EarnToken", caller);
		strategy1 = await getContract("GymVaultsStrategyAlpaca", deployer);
		// strategy2 = await getContract();
		// strategy = await getContract();
		// strategy1 = await getContract("StrategyMock1", deployer);
		// strategy2 = await getContract("StrategyMock2", deployer);
		// strategy = await getContract("StrategyMock", caller);

		// router = await getContract("router", caller);

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
		await WBNB.connect(deployer).transfer(router.address, parseEther("10"));
		// await deployer.sendTransaction({
		// 	value: parseEther("5000"),
		// 	to: router.address
		// });
		await gymToken.connect(holder).approve(router.address, parseEther("1000"));
		await run("gymVaultsBank:add", {
			want: WBNB.address,
			allocPoint: "30",
			withUpdate: "false",
			strategy: strategy1.address,
			caller: "deployer"
		});

		// await wantToken2.connect(deployer).transfer(vzgo.address, testVars.WANTTOKEN_AMOUNT / 4);
		// await wantToken2.connect(deployer).transfer(grno.address, testVars.WANTTOKEN_AMOUNT / 4);
		// await wantToken2.connect(deployer).transfer(router.address, testVars.WANTTOKEN_AMOUNT / 4);

		await gymToken.connect(holder).transfer(gymVaultsBank.address, 2000);
		await gymToken.connect(holder).transfer(router.address, parseEther(testVars.AMOUNT.toString()));

		// await earnToken.connect(deployer).transfer(gymVaultsBank.address, 5000);
		// console.log(".....................");
		await router
			.connect(accounts.holder)
			.addLiquidityETH(
				gymToken.address,
				parseEther("1000"),
				0,
				0,
				accounts.holder.address,
				new Date().getTime() + 20,
				{
					value: parseEther("100"),
					gasLimit: 5000000
				}
			);
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

			// await run("gymVaultsBank:add", {
			// 	want: gymToken.address,
			// 	allocPoint: "30",
			// 	withUpdate: "false",
			// 	strategy: strategy1.address,
			// 	caller: "deployer"
			// });
			// await gymToken.connect(vzgo).approve(gymVaultsBank.address, testVars.AMOUNT);

			await run("gymVaultsBank:deposit", {
				pid: "1",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: "1000"
			});

			await advanceBlockTo((await getBlockNumber()) + 250);
			// await gymVaultsBank.connect(vzgo).claimAndDeposit(1, 0, 0, 0, new Date().getTime() + 20);

			await run("gymVaultsBank:claimAndDeposit", {
				pid: "1",
				caller: "vzgo"
			});

			snapshot = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			pending = (await gymVaultsBank.pendingReward(0, vzgo.address)) + parseEther(farmingData.rewardPerBlock);
			console.log("🚀 ~ file: GymVaultsBank.test.js ~ line 187 ~ pending", pending);
			await gymVaultsBank.connect(vzgo).claim(0);

			await gymToken.connect(vzgo).approve(router.address, pending);

			const c = await router
				.connect(vzgo)
				.swapExactTokensForETHSupportingFeeOnTransferTokens(
					pending,
					0,
					[gymToken.address, variables.WBNB_TOKEN],
					vzgo.address,
					deadline
				);
			console.log("🚀 ~ file: GymVaultsBank.test.js ~ line 203 ~ c", c.toString());

			const a = await WBNB.balanceOf(vzgo.address);
			console.log("🚀 ~ file: GymVaultsBank.test.js ~ line 208 ~ a", a);

			lp = await liquidityProvider
				.connect(holder)
				.addLiquidityETH(gymToken.address, vzgo.address, 0, 0, 0, deadline, 1, {
					value: 100
				});

			console.log("🚀 ~ file: GymVaultsBank.test.js ~ line 218 ~ lp", lp);
			const pairAddress = await factory.getPair(gymToken.address, variables.WBNB_TOKEN);
			lpToken = await getContractAt("IERC20", pairAddress);
			balanceLp = await lpToken.balanceOf(vzgo.address);
			console.log("🚀 ~ file: GymVaultsBank.test.js ~ line 224 ~ balanceLp", balanceLp.toString());
			await network.provider.request({
				method: "evm_revert",
				params: [snapshot]
			});
			expect((await farming.userInfo(0, vzgo.address)).amount).to.equal(variables.ROUTER_MOCK_RETURN_AMOUNT);
		});
	});
});
