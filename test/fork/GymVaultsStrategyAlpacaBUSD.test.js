const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: {
		getNamedSigners,
		getContract,
		getContractAt,
		getSigner,
		utils: { parseEther },
		BigNumber
	},
	ethers,
	run
} = require("hardhat");

const { advanceBlockTo } = require("../utilities/time");
const variables = require("../../utils/constants/solpp")("fork");
const bankData = require("../../utils/constants/data/fork/GymVaultsBank.json");

describe("GymVaultsStrategyAlpacaBUSD contract: ", function () {
	let accounts, deployer, owner, caller, holder;
	// eslint-disable-next-line no-unused-vars
	let gymToken, relationship, farming, buyBack, gymVaultsBank, router, factory, vault, fairLaunch;
	// eslint-disable-next-line no-unused-vars
	let busd, alpaca, ibToken, strategyAlpaca, lpGymBnb, snapshotStart;
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({ deployer, owner, caller, holder } = accounts);
		await fixture("Fork");

		gymToken = await getContract("GymToken", caller);
		relationship = await getContract("GymMLM", deployer);
		farming = await getContract("GymFarming", deployer);
		await run("farming:add", {
			allocPoint: "30",
			lpToken: gymToken.address
		});

		buyBack = await getContract("BuyBack", caller);
		gymVaultsBank = await getContract("GymVaultsBank", deployer);

		router = await getContractAt("IPancakeRouter02", variables.ROUTER);
		factory = await getContractAt("IPancakeFactory", await router.factory());
		vault = await getContractAt("IVault", variables.FAIR_LAUNCH_VAULT);
		fairLaunch = await getContractAt("IFairLaunch", variables.ALPACA_FAIR_LAUNCH);
		busd = await getContractAt("GymToken", variables.BUSD);
		alpaca = await getContractAt("GymToken", variables.ALPACA_TOKEN);
		ibToken = await getContractAt("GymToken", "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f");
		strategyAlpaca = await getContract("GymVaultsStrategyAlpacaBUSD", caller);
		await run("gymMLM:setBankAddress", {
			bankAddress: gymVaultsBank.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:setTreasuryAddress", {
			treasuryAddress: owner.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:setFarmingAddress", {
			farmingAddress: farming.address,
			caller: "deployer"
		});
		await run("gymVaultsBank:setWithdrawFee", {
			withdrawFee: "1000",
			caller: "deployer"
		});

		await gymToken.connect(holder).delegate(buyBack.address);
		await network.provider.request({
			method: "hardhat_impersonateAccount",
			params: ["0xf9211FfBD6f741771393205c1c3F6D7d28B90F03"]
		});

		const signer = await getSigner("0xf9211FfBD6f741771393205c1c3F6D7d28B90F03");

		await busd.connect(signer).transfer(holder.address, await busd.balanceOf(signer.address));

		await network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: ["0xf9211FfBD6f741771393205c1c3F6D7d28B90F03"]
		});

		await gymToken.connect(holder).approve(router.address, parseEther("1000"));

		await router
			.connect(holder)
			.addLiquidityETH(gymToken.address, parseEther("1000"), 0, 0, farming.address, new Date().getTime() + 20, {
				value: parseEther("100")
			});

		lpGymBnb = await factory.getPair(gymToken.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");
		// await run("gymVaultsBank:add", {
		// 	want: busd.address,
		// 	allocPoint: "30",
		// 	withUpdate: "false",
		// 	strategy: strategyAlpaca.address,
		// 	caller: "deployer"
		// });
		await run("gymVaultsBank:add", {
			want: busd.address,
			allocPoint: "30",
			withUpdate: "false",
			strategy: strategyAlpaca.address,
			caller: "deployer"
		});

		await run("farming:add", {
			allocPoint: "30",
			lpToken: lpGymBnb
		});

		await busd.connect(holder).transfer(gymVaultsBank.address, parseEther("1000"));
		await busd.connect(holder).transfer(farming.address, parseEther("1000"));
		await gymToken.connect(holder).transfer(gymVaultsBank.address, parseEther("1000"));
		await gymToken.connect(holder).transfer(router.address, parseEther("1000"));

		await gymToken.connect(holder).approve(router.address, parseEther("2000"));
		await busd.connect(holder).approve(router.address, parseEther("1000"));

		await router
			.connect(holder)
			.addLiquidity(
				gymToken.address,
				busd.address,
				parseEther("1000"),
				parseEther("1000"),
				0,
				0,
				holder.address,
				new Date().getTime() + 20,
				{
					gasLimit: 5000000
				}
			);
	});

	describe("Deposit function: ", function () {
		before("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Should accept deposit from user: ", async function () {
			await busd.connect(holder).approve(gymVaultsBank.address, ethers.utils.parseEther("100"));
			await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: `${parseEther("100")}`,
				referrerId: "1",
				caller: "holder"
			});

			expect(await strategyAlpaca.wantLockedTotal()).to.equal(ethers.utils.parseEther("45"));
			expect(await strategyAlpaca.sharesTotal()).to.equal(ethers.utils.parseEther("45"));
		});
	});

	describe("Claim function: ", function () {
		before("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Should accept claim from user: ", async function () {
			await busd.connect(holder).approve(gymVaultsBank.address, ethers.utils.parseEther("0.1"));
			const tx = await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: `${parseEther("0.1")}`,
				referrerId: "1",
				caller: "holder"
			});

			await advanceBlockTo(tx.blockNumber + 200);
			await gymVaultsBank.updatePool(0);

			const pending = (await gymVaultsBank.userInfo(0, holder.address)).shares
				.mul((await gymVaultsBank.poolInfo(0)).accRewardPerShare)
				.div(BigNumber.from(`${1e18}`));

			await expect(() =>
				run("gymVaultsBank:claim", {
					pid: "0",
					caller: "holder"
				})
			).to.changeTokenBalances(
				gymToken,
				[holder, gymVaultsBank],
				[
					pending.add(parseEther(bankData.rewardRate)),
					pending.add(parseEther(bankData.rewardRate)).mul(ethers.constants.NegativeOne)
				]
			);
		});
	});

	describe("Withdraw function: ", function () {
		before("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Should accept withdraw from user: ", async function () {
			await busd.connect(holder).approve(gymVaultsBank.address, ethers.utils.parseEther("0.1"));

			const tx = await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: `${parseEther("0.1")}`,
				referrerId: "1",
				caller: "holder"
			});

			await advanceBlockTo(tx.blockNumber + 100);
			await expect(() =>
				run("gymVaultsBank:withdraw", {
					pid: "0",
					wantAmt: `${parseEther("0.04")}`,
					caller: "holder"
				})
			).to.changeTokenBalances(busd, [holder], [ethers.utils.parseEther("0.036")]);
		});
	});

	describe("ClaimAndDeposit function: ", function () {
		before("Before: ", async function () {
			snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [snapshotStart]
			});
		});

		it("Should accept claimAndDeposit from user: ", async function () {
			await busd.connect(holder).approve(gymVaultsBank.address, ethers.utils.parseEther("0.1"));
			const tx = await run("gymVaultsBank:deposit", {
				pid: "0",
				wantAmt: `${parseEther("0.1")}`,
				referrerId: "1",
				caller: "holder"
			});

			await advanceBlockTo(tx.blockNumber + 200);

			await run("gymVaultsBank:claimAndDeposit", {
				pid: "0",
				caller: "holder"
			});

			expect((await farming.userInfo(0, holder.address)).amount).to.not.equal(0);
		});
	});
});
