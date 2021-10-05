const { task } = require("hardhat/config");
require("./utils");
require("./deploy");
require("./gymVaultsBank");
require("./gymMLM");

task("setupNext", "Add liquidity without args").setAction(
	async (
		taskArgs,
		{
			config,
			ethers: {
				getNamedSigners,
				getContractAt,
				getContract,
				utils: { parseEther }
			}
		}
	) => {
		const variables = config.solpp.defs;
		const accounts = await getNamedSigners();
		const routerAddress = variables.ROUTER;
		const router = await getContractAt("IPancakeRouter02", routerAddress);
		const gymToken = await getContract("GymToken", accounts.deployer);
		await gymToken.connect(accounts.holder).approve(routerAddress, parseEther("1000"));
		const tx = await router
			.connect(accounts.holder)
			.addLiquidityETH(
				gymToken.address,
				parseEther("1000"),
				0,
				0,
				accounts.holder.address,
				new Date().getTime() + 20,
				{
					value: parseEther("0.1"),
					gasLimit: 5000000
				}
			);
		console.log("🚀 ~ file: index.js ~ line 58 ~ .setAction ~ tx", tx);

		const factory = await getContractAt("IPancakeFactory", await router.factory());
		const pairAddress = await factory.getPair("0xDfb1211E2694193df5765d54350e1145FD2404A1", gymToken.address);
		console.log("🚀 ~ file: index.js ~ line 66 ~ .setAction ~ pairAddress", pairAddress);
		console.log("Succeeded");
	}
);

task("setup", "Contracts Setup").setAction(
	async (
		taskArgs,
		{
			ethers: {
				getNamedSigners,
				getContractAt,
				getContract,
				utils: { parseEther }
			},
			config
		}
	) => {
		const variables = config.solpp.defs;
		console.log("🚀 ~ file: index.js ~ line 91 ~ variables", variables);

		const accounts = await getNamedSigners();
		const WBNB = variables.WBNB_TOKEN;
		const BUSD = variables.BUSD;
		const routerAddress = variables.ROUTER;

		const router = await getContractAt("IPancakeRouter02", routerAddress);
		const factory = await getContractAt("IPancakeFactory", await router.factory());
		const gymToken = await getContract("GymToken");
		const busdToken = await getContractAt("GymToken", BUSD);
		const bank = await getContract("GymVaultsBank");
		const buyBack = await getContract("BuyBack");
		const farming = await getContract("GymFarming");
		const strategy = await getContract("GymVaultsStrategyAlpaca");
		const strategyBUSD = await getContract("GymVaultsStrategyAlpacaBUSD");
		const gymMLM = await getContract("GymMLM");
		await gymToken.connect(accounts.holder).approve(routerAddress, parseEther("2000000000"));
		await busdToken.connect(accounts.holder).approve(routerAddress, parseEther("100000000"));
		await busdToken.connect(accounts.holder).approve(bank.address, parseEther("1000000000"));
		await gymToken.connect(accounts.holder).delegate(accounts.holder.address, {
			gasLimit: 5000000
		});
		await router
			.connect(accounts.holder)
			.addLiquidity(
				gymToken.address,
				BUSD,
				parseEther("1000"),
				parseEther("1000"),
				0,
				0,
				accounts.holder.address,
				new Date().getTime() + 20,
				{
					gasLimit: 5000000
				}
			);

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
					value: parseEther("0.1"),
					gasLimit: 5000000
				}
			);
		console.log("Succeeded");

		await bank.connect(accounts.deployer).setTreasuryAddress(accounts.owner.address);
		await bank.connect(accounts.deployer).setFarmingAddress(farming.address);
		await bank.connect(accounts.deployer).setWithdrawFee(1000);
		await gymMLM.connect(accounts.deployer).setBankAddress(bank.address);

		const pairAddress = await factory.getPair(WBNB, gymToken.address);
		await farming.connect(accounts.deployer).add(30, pairAddress, false, {
			gasLimit: 5000000
		});

		await gymToken.connect(accounts.holder).transfer(bank.address, parseEther("3000000"));
		await gymToken.connect(accounts.holder).transfer(farming.address, parseEther("2000000"));

		await bank.connect(accounts.deployer).add(WBNB, 30, false, strategy.address, {
			gasLimit: 5000000
		});
		await bank.connect(accounts.deployer).add(BUSD, 30, false, strategyBUSD.address, {
			gasLimit: 5000000
		});

		console.log("Succeeded");
	}
);
