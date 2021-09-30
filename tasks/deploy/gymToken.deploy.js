module.exports = async function ({ holder }, { deployments: { deterministic }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic("GymToken", {
		from: deployer.address,
		contract: "GymToken",
		args: [holder],
		log: true,
		deterministicDeployment: true
	});

	await deterministicDeploy.deploy();
	return deterministicDeploy;
};
