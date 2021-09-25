module.exports = async function ({ msg }, { deployments: { deterministic }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic("BuyBack", {
		from: deployer.address,
		contract: "BuyBack",
		args: [],
		log: true,
		deterministicDeployment: true
	});

	await deterministicDeploy.deploy();
};
