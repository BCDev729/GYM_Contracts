module.exports = async function (hre) {
	const { deployer } = await hre.ethers.getNamedAccounts();

	const options = {
		contractName: "GymMLM",
		args: [],
	};

	const deterministic = await hre.deployments.deterministic("GymMLM", {
		from: deployer,
		contract: "GymMLM",
		args: [...options.args],
		log: true,
		deterministicDeployment: true,
	});

	await deterministic.deploy();

	try {
		await hre.run("verify:verify", {
			address: deterministic.address,
			constructorArguments: options.args,
		});
	} catch (e) {
		console.log(e.toString());
	}

	// await contractDeploy(hre, options, async contract => {
	//   try {
	//     await hre.run("verify:verify", {
	//       address: contract.address,
	//       constructorArguments: options.args
	//     });
	//   } catch (e) {
	//     console.log(e.toString())
	//   }
	// })
};

module.exports.tags = ["GymMLM"];
module.exports.dependencies = ["GymVaultsBank"];
