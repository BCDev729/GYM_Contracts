module.exports = async function ({ bankAddress, rewardTokenAddress, rewardPerBlock, startBlock }, { deployments: { deterministic }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic("GymFarming", {
		from: deployer.address,
		contract: "GymFarming",
		args: [bankAddress, rewardTokenAddress, rewardPerBlock, startBlock],
		log: true,
		deterministicDeployment: true,
	});

	await deterministicDeploy.deploy();
	return deterministicDeploy;
};
