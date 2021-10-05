module.exports = async function ({ run, getChainId, ethers: {getContract} }) {

	const chainId = await getChainId();
	if (chainId !== "31337") {
		return;
	}

	const bank = await getContract("GymVaultsBank");
	const isAutoComp = true;
	const vault = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";
	const fairLaunch = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
	const pid = 1;
	const want = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
	const earn = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
	const router = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
	const owner = bank.address;
	const options = {
		contractName: "GymVaultsStrategyAlpaca",
		args: [
			bank.address,
			isAutoComp,
			vault,
			fairLaunch,
			pid,
			want,
			earn,
			router
		],
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
module.exports.tags = ["GymVaultsStrategyAlpaca", "Test"];
module.exports.dependencies = ["GymVaultsBank"];
