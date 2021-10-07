module.exports = async function ({ run, getChainId }) {
	const chainId = await getChainId();
	const deterministicDeploy = await run("deploy:buyBack");

	if (chainId !== "31337") {
		try {
			await run("verify:verify", {
				address: deterministicDeploy.address
			});
		} catch (e) {
			console.log(e.toString());
		}
	}
};
module.exports.tags = ["BuyBack"];
module.exports.dependencies = [];
