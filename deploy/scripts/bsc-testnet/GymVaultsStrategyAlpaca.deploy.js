module.exports = async function ({ run, getChainId, ethers: { getContract } }) {
	const chainId = await getChainId();
	if (chainId !== "97") {
		return;
	}
	const bank = await getContract("GymVaultsBank");
	const isAutoComp = true;
	const vault = "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9";
	const fairLaunch = "0xac2fefDaF83285EA016BE3f5f1fb039eb800F43D";
	const pid = 1;
	const want = "0xDfb1211E2694193df5765d54350e1145FD2404A1";
	const earn = "0x354b3a11D5Ea2DA89405173977E271F58bE2897D";
	const router = "0x367633909278A3C91f4cB130D8e56382F00D1071";
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
