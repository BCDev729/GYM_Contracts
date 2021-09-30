module.exports = async function ({ run }) {
	const deterministicDeploy = await run("deploy:gymMLM");

	try {
		await run("verify:verify", {
			address: deterministicDeploy.address
		});
	} catch (e) {
		console.log(e.toString());
	}
};
module.exports.tags = ["GymMLM"];
module.exports.dependencies = [];
