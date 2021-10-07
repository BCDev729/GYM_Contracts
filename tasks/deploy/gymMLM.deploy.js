module.exports = async function ({ msg }, { deployments: { deterministic }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic("GymMLM", {
		from: deployer.address,
		contract: "GymMLM",
		args: [],
		log: true,
		deterministicDeployment: true
	});

	await deterministicDeploy.deploy();
	return deterministicDeploy;
};
