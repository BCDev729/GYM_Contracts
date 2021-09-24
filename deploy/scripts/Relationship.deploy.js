module.exports = async function (hre) {
	let deterministicDeploy;
	await hre.run("deploy:gymMLM");

	try {
		await hre.run("verify:verify", {
			address: deterministicDeploy.address,
		});
	} catch (e) {
		console.log(e.toString());
	}
};
module.exports.tags = ["GymMLM"];
module.exports.dependencies = ["GymVaultsBank"];
