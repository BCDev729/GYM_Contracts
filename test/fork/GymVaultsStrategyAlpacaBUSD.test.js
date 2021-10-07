const { expect } = require("chai");
const {
	deployments: { fixture },
	network,
	ethers: {
		getNamedSigners,
		getContract,
		getContractAt,
		getSigner,
		utils: { parseEther }
	},
	ethers
} = require("hardhat");

const { advanceBlockTo } = require("../utilities/time");
const variables = require("../../utils/constants/solpp")("fork");
const farmingData = require("../../utils/constants/data/fork/GymFarming.json");


describe("GymVaultsStrategyAlpacaBUSD contract: ", function () {
	let accounts, deployer, owner, caller, holder;
	// eslint-disable-next-line no-unused-vars
	let gymToken, relationship, farming, buyBack, gymVaultsBank, router, factory, vault, fairLaunch;
	// eslint-disable-next-line no-unused-vars
	let busd, alpaca, ibToken, strategyAlpaca, lpGymBnb, snapshotStart;
	before("Before All: ", async function () {
		accounts = await getNamedSigners();
		({ deployer, owner, caller, holder } = accounts);
		await fixture();

		gymToken = await getContract("GymToken", caller);
		relationship = await getContract("GymMLM", deployer);
		farming = await getContract("GymFarming", deployer);
		await farming.connect(deployer).add(30, gymToken.address, false);
		buyBack = await getContract("BuyBack", caller);
		gymVaultsBank = await getContract("GymVaultsBank", deployer);

		router = await getContractAt("IPancakeRouter02", variables.ROUTER);
		factory = await getContractAt("IPancakeFactory", await router.factory());
		vault = await getContractAt("IVault", variables.FAIR_LAUNCH_VAULT);
		fairLaunch = await getContractAt("IFairLaunch", variables.ALPACA_FAIR_LAUNCH);
		busd = await getContractAt("GymToken", variables.BUSD);
		alpaca = await getContractAt("GymToken", variables.ALPACA_TOKEN);
		ibToken = await getContractAt("GymToken", "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f");
		strategyAlpaca = await getContract("GymVaultsStrategyAlpaca", caller);
		await relationship.setBankAddress(gymVaultsBank.address);
		await gymVaultsBank.connect(deployer).setTreasuryAddress(owner.address);
		await gymVaultsBank.connect(deployer).setFarmingAddress(farming.address);
		await gymVaultsBank.connect(deployer).setWithdrawFee(1000);
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
			.addLiquidityETH(
				gymToken.address,
				parseEther("1000"),
				0,
				0,
				farming.address,
				new Date().getTime() + 20,
				{
					value: parseEther("100")
				}
			);

		lpGymBnb = await factory.getPair(gymToken.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");

		await gymVaultsBank.connect(deployer).add(busd.address, 30, false, strategyAlpaca.address);
		await gymVaultsBank.connect(deployer).add(busd.address, 30, false, strategyAlpaca.address);
		await farming.connect(deployer).add(30, lpGymBnb, false);

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

			await gymVaultsBank
				.connect(holder)
				.deposit(1, ethers.utils.parseEther("100"), 1, 0, new Date().getTime() + 20);
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

			const tx = await gymVaultsBank
				.connect(holder)
				.deposit(1, ethers.utils.parseEther("0.1"), 1, 0, new Date().getTime() + 20);

			await advanceBlockTo(tx.blockNumber + 100);

			const pending = await gymVaultsBank.pendingReward(1, holder.address);

			await expect(() => gymVaultsBank.connect(holder).claim(1)).to.changeTokenBalances(
				gymToken,
				[holder, gymVaultsBank],
				[
					pending.add(farmingData.rewardPerBlock.div(2)),
					pending.add(farmingData.rewardPerBlock.div(2)).mul(ethers.constants.NegativeOne)
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

			const tx = await gymVaultsBank
				.connect(holder)
				.deposit(1, ethers.utils.parseEther("0.1"), 1, 0, new Date().getTime() + 20);

			await advanceBlockTo(tx.blockNumber + 100);

			await expect(() =>
				gymVaultsBank.connect(holder).withdraw(1, ethers.utils.parseEther("0.04"))
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

			const tx = await gymVaultsBank
				.connect(holder)
				.deposit(1, ethers.utils.parseEther("0.1"), 1, 0, new Date().getTime() + 20);

			await advanceBlockTo(tx.blockNumber + 100);

			await gymVaultsBank.connect(holder).claimAndDeposit(1, 0, 0, 0, new Date().getTime() + 20);
			expect((await farming.userInfo(0, holder.address)).amount).to.not.equal(0);
		});
	});
});
