module.exports = async function (hre) {
	let deterministicDeploy;
	await hre.run("deploy:buyBack");

	try {
		await hre.run("verify:verify", {
			address: deterministicDeploy.address,
		});
	} catch (e) {
		console.log(e.toString());
	}
};
module.exports.tags = ["BuyBack"];
module.exports.dependencies = [];
