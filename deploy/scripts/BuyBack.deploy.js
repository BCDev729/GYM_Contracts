module.exports = async function (hre) {
	const { deployer } = await hre.ethers.getNamedAccounts();

	const deterministic = await hre.deployments.deterministic("BuyBack", {
		from: deployer,
		contract: "BuyBack",
		log: true,
		deterministicDeployment: true,
	});

	await deterministic.deploy();
	try {
		await hre.run("verify:verify", {
			address: deterministic.address,
		});
	} catch (e) {
		console.log(e.toString());
	}

	// await contractDeploy(hre, "BuyBack", async contract => {
	//   try {
	//     await hre.run("verify:verify", {
	//       address: contract.address,
	//     });
	//   } catch (e) {
	//     console.log(e.toString())
	//   }
	// })
};
module.exports.tags = ["BuyBack"];
module.exports.dependencies = [];
