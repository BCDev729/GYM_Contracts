const args = require("../../utils/constants/data/bsc-testnet/GymVaultsStrategyAlpaca.json");
const { proxies } = require("./../../.openzeppelin/unknown-97.json");

module.exports = async function ({ run }) {
	const isAutoComp = args.isAutoComp;
	const vault = args.vault;
	const fairLaunch = args.fairLaunch;
	const pid = args.pid;
	const want = args.want;
	const earn = args.earn;
	const router = args.router;

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
module.exports.tags = ["GymVaultsStrategyAlpaca", "Proxy"];
module.exports.dependencies = ["GymVaultsBank"];
