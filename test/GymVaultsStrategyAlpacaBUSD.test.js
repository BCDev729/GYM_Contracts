const { expect } = require("chai");
const {
	deployments,
	network,
	getChainId,
	ethers: { getContract, getContractAt, getNamedSigners }
} = require("hardhat");
const { advanceBlockTo } = require("./utilities");

const { getDeploymentArgs } = require("../utils");

let accounts, rewardPerBlock;

describe("GymVaultsStrategyAlpacaBUSD contract: ", function () {
	// only working when forked
	before("Before All: ", async function () {
		const chainId = await getChainId();
		accounts = await getNamedSigners();

		let deploymentArgs = await getDeploymentArgs(chainId, "GymToken");

		await deployments.deploy("GymToken", {
			from: accounts.deployer.address,
			args: [deploymentArgs.holder],
			log: true,
			deterministicDeployment: false
		});

		this.gymToken = await getContract("GymToken", accounts.caller);

		await deployments.deploy("GymMLM", {
			from: accounts.deployer.address,
			args: [],
			log: true,
			deterministicDeployment: false
		});

		this.gymMLM = await getContract("GymMLM");

		await deployments.deploy("BuyBack", {
			from: accounts.deployer.address,
			args: [],
			log: true,
			deterministicDeployment: false
		});

		this.buyBack = await getContract("BuyBack");

		deploymentArgs = await getDeploymentArgs(chainId, "GymVaultsBank");

		await deployments.deploy("GymVaultsBank", {
			from: accounts.deployer.address,
			contract: "GymVaultsBank",
			args: [deploymentArgs.startBlock, deploymentArgs.gymTokenAddress, deploymentArgs.rewardRate],
			log: true,
			deterministicDeployment: false
		});

		this.bank = await ethers.getContract("GymVaultsBank");

		deploymentArgs = await getDeploymentArgs(chainId, "GymFarming");

		await deployments.deploy("GymFarming", {
			from: accounts.deployer.address,
			args: [
				deploymentArgs.bank,
				deploymentArgs.rewardToken,
				deploymentArgs.rewardPerBlock,
				deploymentArgs.startBlock
			],
			log: true,
			deterministicDeployment: false
		});
		rewardPerBlock = deploymentArgs.rewardPerBlock;
		this.farming = await ethers.getContract("GymFarming");

		deploymentArgs = await getDeploymentArgs(chainId, "GymVaultsStrategyAlpacaBUSD");

		await deployments.deploy("GymVaultsStrategyAlpacaBUSD", {
			from: accounts.deployer.address,
			contract: "GymVaultsStrategyAlpaca",
			args: [
				deploymentArgs.bank,
				deploymentArgs.isAutoComp,
				deploymentArgs.vault,
				deploymentArgs.fairLaunch,
				deploymentArgs.pid,
				deploymentArgs.want,
				deploymentArgs.earn,
				deploymentArgs.router
			],
			log: true,
			deterministicDeployment: false
		});

		this.router = await getContractAt("IPancakeRouter02", deploymentArgs.router);
		this.factory = await getContractAt("IPancakeFactory", await this.router.factory());
		this.vault = await getContractAt("IVault", deploymentArgs.vault);
		this.fairLaunch = await getContractAt("IFairLaunch", deploymentArgs.fairLaunch);
		this.busd = await getContractAt("GymToken", deploymentArgs.want);
		this.alpaca = await getContractAt("GymToken", deploymentArgs.earn);
		this.ibToken = await getContractAt("GymToken", "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f");
		this.strategyAlpaca = await getContract("GymVaultsStrategyAlpacaBUSD", accounts.caller);

		await this.gymMLM.setBankAddress(this.bank.address);
		await this.bank.connect(accounts.deployer).setTreasuryAddress(accounts.owner.address);
		await this.bank.connect(accounts.deployer).setFarmingAddress(this.farming.address);
		await this.bank.connect(accounts.deployer).setWithdrawFee(1000);
		await this.gymToken.connect(accounts.holder).delegate(this.buyBack.address);

		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: ["0xf9211FfBD6f741771393205c1c3F6D7d28B90F03"]
		});

		const signer = await ethers.getSigner("0xf9211FfBD6f741771393205c1c3F6D7d28B90F03");

		await this.busd.connect(signer).transfer(accounts.holder.address, await this.busd.balanceOf(signer.address));

		await network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: ["0xf9211FfBD6f741771393205c1c3F6D7d28B90F03"]
		});

		await this.gymToken.connect(accounts.holder).approve(this.router.address, ethers.utils.parseEther("1000"));

		await this.router
			.connect(accounts.holder)
			.addLiquidityETH(
				this.gymToken.address,
				ethers.utils.parseEther("1000"),
				0,
				0,
				this.farming.address,
				new Date().getTime() + 20,
				{
					value: ethers.utils.parseEther("100")
				}
			);

		this.lpGymBnb = await this.factory.getPair(this.gymToken.address, "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c");

		await this.bank.connect(accounts.deployer).add(this.busd.address, 30, false, this.strategyAlpaca.address);
		await this.bank.connect(accounts.deployer).add(this.busd.address, 30, false, this.strategyAlpaca.address);
		await this.farming.connect(accounts.deployer).add(30, this.lpGymBnb, false);

		await this.busd.connect(accounts.holder).transfer(this.bank.address, ethers.utils.parseEther("1000"));
		await this.busd.connect(accounts.holder).transfer(this.farming.address, ethers.utils.parseEther("1000"));
		await this.gymToken.connect(accounts.holder).transfer(this.bank.address, ethers.utils.parseEther("1000"));
		await this.gymToken.connect(accounts.holder).transfer(this.router.address, ethers.utils.parseEther("1000"));

		await this.gymToken.connect(accounts.holder).approve(this.router.address, ethers.utils.parseEther("2000"));
		await this.busd.connect(accounts.holder).approve(this.router.address, ethers.utils.parseEther("1000"));

		await this.router
			.connect(accounts.holder)
			.addLiquidity(
				this.gymToken.address,
				this.busd.address,
				ethers.utils.parseEther("1000"),
				ethers.utils.parseEther("1000"),
				0,
				0,
				accounts.holder.address,
				new Date().getTime() + 20,
				{
					gasLimit: 5000000
				}
			);
	});

	describe("Deposit function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should accept deposit from user: ", async function () {
			await this.busd.connect(accounts.holder).approve(this.bank.address, ethers.utils.parseEther("100"));

			await this.bank
				.connect(accounts.holder)
				.deposit(1, ethers.utils.parseEther("100"), 1, 0, new Date().getTime() + 20);
			expect(await this.strategyAlpaca.wantLockedTotal()).to.equal(ethers.utils.parseEther("45"));
			expect(await this.strategyAlpaca.sharesTotal()).to.equal(ethers.utils.parseEther("45"));
		});
	});

	describe("Claim function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should accept claim from user: ", async function () {
			await this.busd.connect(accounts.holder).approve(this.bank.address, ethers.utils.parseEther("0.1"));

			const tx = await this.bank
				.connect(accounts.holder)
				.deposit(1, ethers.utils.parseEther("0.1"), 1, 0, new Date().getTime() + 20);

			await advanceBlockTo(tx.blockNumber + 100);

			const pending = await this.bank.pendingReward(1, accounts.holder.address);

			await expect(() => this.bank.connect(accounts.holder).claim(1)).to.changeTokenBalances(
				this.gymToken,
				[accounts.holder, this.bank],
				[
					pending.add(rewardPerBlock.div(2)),
					pending.add(rewardPerBlock.div(2)).mul(ethers.constants.NegativeOne)
				]
			);
		});
	});

	describe("Withdraw function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should accept withdraw from user: ", async function () {
			await this.busd.connect(accounts.holder).approve(this.bank.address, ethers.utils.parseEther("0.1"));

			const tx = await this.bank
				.connect(accounts.holder)
				.deposit(1, ethers.utils.parseEther("0.1"), 1, 0, new Date().getTime() + 20);

			await advanceBlockTo(tx.blockNumber + 100);

			await expect(() =>
				this.bank.connect(accounts.holder).withdraw(1, ethers.utils.parseEther("0.04"))
			).to.changeTokenBalances(this.busd, [accounts.holder], [ethers.utils.parseEther("0.036")]);
		});
	});

	describe("ClaimAndDeposit function: ", function () {
		before("Before: ", async function () {
			this.snapshotStart = await network.provider.request({
				method: "evm_snapshot",
				params: []
			});
		});

		after("After tests: ", async function () {
			await network.provider.request({
				method: "evm_revert",
				params: [this.snapshotStart]
			});
		});

		it("Should accept claimAndDeposit from user: ", async function () {
			await this.busd.connect(accounts.holder).approve(this.bank.address, ethers.utils.parseEther("0.1"));

			const tx = await this.bank
				.connect(accounts.holder)
				.deposit(1, ethers.utils.parseEther("0.1"), 1, 0, new Date().getTime() + 20);

			await advanceBlockTo(tx.blockNumber + 100);

			await this.bank.connect(accounts.holder).claimAndDeposit(1, 0, 0, 0, new Date().getTime() + 20);
			expect((await this.farming.userInfo(0, accounts.holder.address)).amount).to.not.equal(0);
		});
	});
});
