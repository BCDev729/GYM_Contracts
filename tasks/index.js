require("./utils");
require("./deploy");

const { VARIABLES } = require("../utils");

task("addPool", "Add new pool to bank")
    .addParam("bank", "Bank address")
    .addParam("want", "Want token address")
    .addParam("allocPoint", "Pool allocation point")
    .addParam("withUpdate", "Will be pool update")
    .addParam("strategy", "Strategy address")
    .setAction(async (taskArgs) => {
        let accounts = await ethers.getNamedSigners();
        let gymVaultsBank = await ethers.getContractAt("GymVaultsBank", taskArgs.bank, accounts.deployer);

        await gymVaultsBank.add(taskArgs.want, taskArgs.allocPoint, taskArgs.withUpdate, taskArgs.strategy);

        console.log("Pool added");
    });

task("addLiquidity", "Add liquidity")
    .addParam("router", "PanCakeRouter address")
    .addParam("token", "Token address")
    .addParam("tokenAmount", "Amount of token to add liquidity")
    .addParam("bnbAmount", "Amount of bnb to add liquidity")
    .addParam("to", "LP tokens receiver")
    .setAction(async (taskArgs) => {
        let accounts = await ethers.getNamedSigners();
        let router = await ethers.getContractAt("IPancakeRouter02", taskArgs.router);
        let token = await ethers.getContractAt("GymToken", taskArgs.token);
        await token.connect(accounts.holder).approve(taskArgs.router, ethers.utils.parseEther(taskArgs.tokenAmount));
        let tx = await router
            .connect(accounts.holder)
            .addLiquidityETH(
                taskArgs.token,
                ethers.utils.parseEther(taskArgs.tokenAmount),
                0,
                0,
                taskArgs.to,
                new Date().getTime() + 20,
                {
                    value: ethers.utils.parseEther(taskArgs.bnbAmount),
                }
            );

        console.log("🚀 ~ file: index.js ~ line 169 ~ .setAction ~ tx", tx.hash);
    });

task("setupNext", "Add liquidity without args").setAction(async () => {
    let accounts = await ethers.getNamedSigners();
    let routerAddress = "0x367633909278A3C91f4cB130D8e56382F00D1071";
    let router = await ethers.getContractAt("IPancakeRouter02", routerAddress);
    let gymToken = await ethers.getContract("GymToken", accounts.deployer);
    await gymToken.connect(accounts.holder).approve(routerAddress, ethers.utils.parseEther("1000"));
    let tx = await router
        .connect(accounts.holder)
        .addLiquidityETH(
            gymToken.address,
            ethers.utils.parseEther("1000"),
            0,
            0,
            accounts.holder.address,
            new Date().getTime() + 20,
            {
                value: ethers.utils.parseEther("0.1"),
                gasLimit: 5000000,
            }
        );
    console.log("🚀 ~ file: index.js ~ line 58 ~ .setAction ~ tx", tx);

    const factory = await ethers.getContractAt("IPancakeFactory", await router.factory());
    const pairAddress = await factory.getPair("0xDfb1211E2694193df5765d54350e1145FD2404A1", gymToken.address);
    console.log("🚀 ~ file: index.js ~ line 66 ~ .setAction ~ pairAddress", pairAddress);
    console.log("Succeeded");
});

task("setup", "Contracts Setup").setAction(async () => {
    const NETWORK = process.env.NETWORK || "hardhat";
    const variables = VARIABLES[`${NETWORK}`];

    let accounts = await ethers.getNamedSigners();
    let WBNB = variables.contracts[2];
    let BUSD = variables.contracts[5];
    let routerAddress = variables.contracts[0];

    let router = await ethers.getContractAt("IPancakeRouter02", routerAddress);
    let factory = await ethers.getContractAt("IPancakeFactory", await router.factory());
    let gymToken = await ethers.getContract("GymToken");
    let busdToken = await ethers.getContractAt("GymToken", BUSD);
    let bank = await ethers.getContract("GymVaultsBank");
    let buyBack = await ethers.getContract("BuyBack");
    let farming = await ethers.getContract("GymFarming");
    let strategy = await ethers.getContract("GymVaultsStrategyAlpaca");
    let strategyBUSD = await ethers.getContract("GymVaultsStrategyAlpacaBUSD");
    let gymMLM = await ethers.getContract("GymMLM");
    await gymToken.connect(accounts.holder).approve(routerAddress, ethers.utils.parseEther("2000000000"));
    await busdToken.connect(accounts.holder).approve(routerAddress, ethers.utils.parseEther("100000000"));
    await busdToken.connect(accounts.holder).approve(bank.address, ethers.utils.parseEther("1000000000"));
    await gymToken.connect(accounts.holder).delegate(accounts.holder.address, {
        gasLimit: 5000000,
    });
    await router
        .connect(accounts.holder)
        .addLiquidity(
            gymToken.address,
            BUSD,
            ethers.utils.parseEther("1000"),
            ethers.utils.parseEther("1000"),
            0,
            0,
            accounts.holder.address,
            new Date().getTime() + 20,
            {
                gasLimit: 5000000,
            }
        );

    await router
        .connect(accounts.holder)
        .addLiquidityETH(
            gymToken.address,
            ethers.utils.parseEther("1000"),
            0,
            0,
            accounts.holder.address,
            new Date().getTime() + 20,
            {
                value: ethers.utils.parseEther("0.1"),
                gasLimit: 5000000,
            }
        );
    console.log("Succeeded");

    await bank.connect(accounts.deployer).setTreasuryAddress(accounts.owner.address);
    await bank.connect(accounts.deployer).setFarmingAddress(farming.address);
    await bank.connect(accounts.deployer).setWithdrawFee(1000);
    await gymMLM.connect(accounts.deployer).setBankAddress(bank.address);

    const pairAddress = await factory.getPair(WBNB, gymToken.address);
    await farming.connect(accounts.deployer).add(30, pairAddress, false, {
        gasLimit: 5000000,
    });

    await gymToken.connect(accounts.holder).transfer(bank.address, ethers.utils.parseEther("3000000"));
    await gymToken.connect(accounts.holder).transfer(farming.address, ethers.utils.parseEther("2000000"));

    await bank.connect(accounts.deployer).add(WBNB, 30, false, strategy.address, {
        gasLimit: 5000000,
    });
    await bank.connect(accounts.deployer).add(BUSD, 30, false, strategyBUSD.address, {
        gasLimit: 5000000,
    });

    console.log("Succeeded");
});

task("deployMocks", "Deploying mocks for tests").setAction(async () => {
    await hre.run("deploy", {
        deployScripts: "deploy/scripts/mocks",
    });
});
