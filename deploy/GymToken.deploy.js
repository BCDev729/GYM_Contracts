module.exports = async function ({ run, getNamedAccounts }) {
	const { holder } = await getNamedAccounts();

	const options = {
		contractName: "GymToken",
		args: [holder]
	};

	const deterministicDeploy = await run("deploy:gymToken", {
		holder: holder
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
module.exports.tags = ["GymToken"];
