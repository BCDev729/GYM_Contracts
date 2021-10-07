module.exports = async function ({ run, getNamedAccounts, getChainId }) {
	const chainId = await getChainId();
	const { holder } = await getNamedAccounts();

	const options = {
		contractName: "GymToken",
		args: [holder]
	};

	const deterministicDeploy = await run("deploy:gymToken", {
		holder: holder
	});
	if (chainId !== "31337") {
		try {
			await run("verify:verify", {
				address: deterministicDeploy.address,
				constructorArguments: options.args
			});
		} catch (e) {
			console.log(e.toString());
		}
	}
};
module.exports.tags = ["GymToken", "Hardhat"];
