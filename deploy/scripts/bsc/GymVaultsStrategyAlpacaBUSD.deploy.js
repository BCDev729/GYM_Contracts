module.exports = async function ({ run, getChainId, ethers: { getContract } }) {
	const chainId = await getChainId();
	if (chainId !== "56") {
		return;
	}

	const bank = await getContract("GymVaultsBank");
	const isAutoComp = true;
	const vault = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f";
	const fairLaunch = "0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F";
	const pid = 3;
	const want = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
	const earn = "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F";
	const router = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
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
module.exports.tags = ["GymVaultsStrategyAlpacaBUSD"];
module.exports.dependencies = ["GymVaultsBank"];
