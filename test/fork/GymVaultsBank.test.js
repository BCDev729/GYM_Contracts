const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: {
		getNamedSigners,
		getContract,
		getContractAt,
		utils: { parseEther },
		provider: { getBlockNumber, getBalance }
	},
	run
} = require("hardhat");

const { advanceBlockTo } = require("../utilities/time");
const testVars = require("../utilities/testVariables.json");
const variables = require("../../utils/constants/solpp")("fork");
const farmingData = require("../../utils/constants/data/fork/GymFarming.json");
describe("GymVaultsBank contract: ", function () {
	let accounts, deployer, owner, caller, holder, vzgo;
	let gymToken, relationship, farming, buyBack, gymVaultsBank, WBNB, liquidityProvider, lpToken, balanceLp, pending;

	let strategy, router, factory, snapshotId, snapshot;
	const startBlock = 200;
	const deadline = new Date().getTime() + 10;
	before("Before All: ", async function () {
		await fixture("Fork");

		accounts = await getNamedSigners();
		({ deployer, owner, caller, holder, vzgo } = accounts);

		gymToken = await getContract("GymToken", caller);
		relationship = await getContract("GymMLM", caller);
		farming = await getContract("GymFarming", deployer);
		liquidityProvider = await getContractAt("ILiquidityProvider", variables.LIQUIDITY_PROVIDER);

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

		strategy = await getContract("GymVaultsStrategyAlpaca", deployer);

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

		await gymToken.connect(holder).approve(router.address, parseEther("1000"));
		await run("gymVaultsBank:add", {
			want: WBNB.address,
			allocPoint: "30",
			withUpdate: "false",
			strategy: strategy.address,
			caller: "deployer"
		});

		await gymToken.connect(holder).transfer(gymVaultsBank.address, 2000);
		await gymToken.connect(holder).transfer(router.address, parseEther(testVars.AMOUNT.toString()));

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
			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: testVars.AMOUNT.toString(),
				referrerId: (await relationship.addressToId(deployer.address)).toString(),
				caller: "vzgo",
				bnbAmount: "100"
			});

			await advanceBlockTo((await getBlockNumber()) + 250);

			pending = (await gymVaultsBank.pendingReward(0, vzgo.address)).add(parseEther(farmingData.rewardPerBlock));

			snapshot = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});

			await gymVaultsBank.connect(vzgo).claim(0);

			await gymToken.connect(holder).approve(router.address, pending);

			const startBalance = await getBalance(caller.address);

			await router
				.connect(holder)
				.swapExactTokensForETHSupportingFeeOnTransferTokens(
					pending,
					0,
					[gymToken.address, variables.WBNB_TOKEN],
					caller.address,
					deadline
				);
			const finishBalace = await getBalance(caller.address);

			const diff = finishBalace.sub(startBalance);

			const pairAddress = await factory.getPair(variables.WBNB_TOKEN, gymToken.address);
			lpToken = await getContractAt("IERC20", pairAddress);

			await liquidityProvider
				.connect(caller)
				.addLiquidityETH(gymToken.address, vzgo.address, 0, 0, 0, deadline, 1, {
					value: diff
				});

			balanceLp = await lpToken.balanceOf(vzgo.address);

			await network.provider.request({
				method: "evm_revert",
				params: [snapshot]
			});

			await run("gymVaultsBank:claimAndDeposit", {
				pid: "0",
				caller: "vzgo"
			});
			expect((await farming.userInfo(0, vzgo.address)).amount).to.equal(balanceLp);
		});
	});
});
