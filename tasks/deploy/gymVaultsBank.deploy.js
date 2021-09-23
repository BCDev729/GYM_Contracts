module.exports = async function ({ startblock, gymtokenaddress, rewardrate}, { deployments: { deterministic }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic("GymVaultsBank", {
		from: deployer.address,
		contract: "GymVaultsBank",
		args: [startblock, gymtokenaddress, rewardrate],
		log: true,
		deterministicDeployment: true,
	});
console.log("detereterere");
	await deterministicDeploy.deploy();
};
