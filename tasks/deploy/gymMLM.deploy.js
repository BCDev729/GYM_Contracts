module.exports = async function ({ msg }, { deployments: { deterministic }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic("GymMLM", {
		from: deployer.address,
		contract: "GymMLM",
		args: [],
		log: true,
		deterministicDeployment: true
	});
	console.log("🚀 ~ file: gymMLM.deploy.js ~ line 11 ~ deterministicDeploy", deterministicDeploy.address);

	await deterministicDeploy.deploy();
	return deterministicDeploy;
};
