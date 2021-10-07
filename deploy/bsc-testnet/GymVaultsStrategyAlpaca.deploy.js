const args = require("../../utils/constants/data/bsc-testnet/GymVaultsStrategyAlpaca.json");
module.exports = async function ({ run, getChainId, ethers: { getContract } }) {
	const chainId = await getChainId();
	if (chainId !== "97") {
		return;
	}
	const bank = await getContract("GymVaultsBank");
	const isAutoComp = args.isAutoComp;
	const vault = args.vault;
	const fairLaunch = args.fairLaunch;
	const pid = args.pid;
	const want = args.want;
	const earn = args.earn;
	const router = args.router;
	const owner = bank.address;
	const options = {
		contractName: "GymVaultsStrategyAlpaca",
		args: [bank.address, isAutoComp, vault, fairLaunch, pid, want, earn, router],
		owner: owner
	};

	const deterministicDeploy = await run("deploy:gymVaultsStrategy", {
		contractName: "GymVaultsStrategyAlpaca",
		bank: bank.address,
		isAutoComp: isAutoComp.toString(),
		vault: vault,
		fairLaunch: fairLaunch,
		pid: pid.toString(),
		want: want,
		earn: earn,
		router: router
	});
	try {
		await run("verify:verify", {
			address: deterministicDeploy.address,
			constructorArguments: options.args
		});
	} catch (e) {
		console.log(e.toString());
	}
};
module.exports.tags = ["GymVaultsStrategyAlpaca"];
module.exports.dependencies = ["GymVaultsBank"];
