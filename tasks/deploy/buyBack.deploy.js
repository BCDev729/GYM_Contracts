module.exports = async function ({ msg }, { deployments: { deterministic }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic("BuyBack", {
		from: deployer.address,
		contract: "BuyBack",
		args: [],
		log: true,
		deterministicDeployment: true
	});
	console.log("🚀 ~ file: buyBack.deploy.js ~ line 11 ~ deterministicDeploy", deterministicDeploy.address);

	await deterministicDeploy.deploy();
	return deterministicDeploy;
};
