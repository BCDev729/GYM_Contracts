const args = require("../../utils/constants/data/fork/GymVaultsStratedyAlpaca.json");
module.exports = async function ({
	config: {
		networks: {
			hardhat: { forking }
		}
	},
	run,
	getChainId,
	ethers: { getContract }
}) {
	const chainId = await getChainId();
	if (chainId !== "31337" || !forking.enabled) {
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
	// const owner = bank.address;

	await run("deploy:gymVaultsStrategy", {
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
};
module.exports.tags = ["GymVaultsStrategyAlpaca", "Hardhat", "Fork"];
module.exports.dependencies = ["GymVaultsBank"];
