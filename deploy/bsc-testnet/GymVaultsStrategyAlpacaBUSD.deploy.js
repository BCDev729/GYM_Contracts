const args = require("../../utils/constants/data/bsc-testnet/GymVaultsStrategyAlpacaBUSD.json");

module.exports = async function ({ run, getChainId, ethers: { getContract } }) {
	const bank = await getContract("GymVaultsBank");
	const isAutoComp = args.isAutoComp;
	const vault = args.vault;
	const fairLaunch = args.fairLaunch;
	const pid = args.pid;
	const want = args.want;
	const earn = args.earn;
	const router = args.router;

	await run("deploy:gymVaultsStrategy", {
		contractName: "GymVaultsStrategyAlpacaBUSD",
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
module.exports.tags = ["GymVaultsStrategyAlpacaBUSD", "bsc-testnet"];
module.exports.dependencies = ["GymVaultsBank"];
