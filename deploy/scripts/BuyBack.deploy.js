module.exports = async function ({ run }) {
	let deterministicDeploy;
	await run("deploy:buyBack");

	try {
		await run("verify:verify", {
			address: deterministicDeploy.address
		});
	} catch (e) {
		console.log(e.toString());
	}
};
module.exports.tags = ["BuyBack"];
module.exports.dependencies = [];
