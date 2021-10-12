module.exports = async function (
	{ startblock, gymTokenAddress, rewardRate },
	{
		ethers: {
			getNamedSigners
		},
		deployments: { deterministic }
		// upgrades: { deployProxy }
	}
) {
	const { deployer } = await getNamedSigners();

	const deterministicDeploy = await deterministic("GymVaultsBank", {
		from: deployer.address,
		contract: "GymVaultsBank",
		args: [startblock, gymTokenAddress, rewardRate],
		log: true,
		deterministicDeployment: true
	});
	await deterministicDeploy.deploy();
	return deterministicDeploy;

	// const GymVaultsBank = await getContractFactory("GymVaultsBank");
	// const gymVaultsBank = await deployProxy(GymVaultsBank, [startblock, gymTokenAddress, rewardRate]);
	// await gymVaultsBank.deployed();
	// console.log(gymVaultsBank.address);
	// return gymVaultsBank.address;
};
