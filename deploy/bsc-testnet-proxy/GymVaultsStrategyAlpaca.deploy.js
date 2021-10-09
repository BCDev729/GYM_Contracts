const args = require("../../utils/constants/data/bsc-testnet/GymVaultsStrategyAlpaca.json");

module.exports = async function ({ run, ethers: { getContract } }) {
	const bank = await getContract("GymVaultsBankProxy");
	const isAutoComp = args.isAutoComp;
	const vault = args.vault;
	const fairLaunch = args.fairLaunch;
	const pid = args.pid;
	const want = args.want;
	const earn = args.earn;
	const router = args.router;

	await run("deploy:gymVaultsStrategyProxy", {
		contractName: "GymVaultsStrategyAlpacaProxy",
		bank: bank.address,
		isAutoComp: isAutoComp.toString(),
		vault: vault,
		fairLaunch: fairLaunch,
		pid: pid.toString(),
		want: want,
		earn: earn,
		router: router
	});
};
module.exports.tags = ["GymVaultsStrategyAlpaca", "Proxy"];
module.exports.dependencies = ["GymVaultsBank"];
