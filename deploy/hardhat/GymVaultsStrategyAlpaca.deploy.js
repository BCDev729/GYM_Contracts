const args = require("../../utils/constants/data/hardhat/GymVaultsStratedyAlpaca.json");
module.exports = async function ({
	config,
	run,
	ethers: { getContract }
}) {
	if(config.networks.hardhat.forking.enabled) return;

	const bank = await getContract("BankMock");
	const isAutoComp = args.isAutoComp;
	const vault = args.vault;
	const fairLaunch = args.fairLaunch;
	const pid = args.pid;
	const want = args.want;
	const earn = args.earn;
	const router = args.router;

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
module.exports.tags = ["GymVaultsStrategyAlpaca", "Hardhat"];
module.exports.dependencies = ["BankMock"];
