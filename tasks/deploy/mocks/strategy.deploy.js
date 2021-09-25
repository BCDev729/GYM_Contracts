module.exports = async function (
	{ contractName, wantAddress },
	{ deployments: { deploy }, ethers: { getNamedSigners } }
) {
	const { deployer } = await getNamedSigners();

	const contractInstance = await deploy(contractName, {
		from: deployer.address,
		contract: "StrategyMock",
		args: [wantAddress],
		log: true
	});

	return contractInstance.address;
};
