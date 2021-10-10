const args = require("../../utils/constants/data/bsc/GymVaultsStrategyAlpacaBUSD.json");

module.exports = async function ({ run }) {
	const isAutoComp = args.isAutoComp;
	const vault = args.vault;
	const fairLaunch = args.fairLaunch;
	const pid = args.pid;
	const want = args.want;
	const earn = args.earn;
	const router = args.router;
	const { proxies } = require("./../../.openzeppelin/unknown-56.json");

	await run("deploy:gymVaultsStrategyProxy", {
		contractName: "GymVaultsStrategyAlpacaProxy",
		bank: proxies[proxies.length - 1].address,
		isAutoComp: isAutoComp.toString(),
		vault: vault,
		fairLaunch: fairLaunch,
		pid: pid.toString(),
		want: want,
		earn: earn,
		router: router
	});
};
module.exports.tags = ["GymVaultsStrategyAlpacaBUSDProxy", "Proxy"];
module.exports.dependencies = ["GymVaultsBankProxy"];
