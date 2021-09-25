module.exports = async function (
	{ contractName, symbol, supply },
	{ deployments: { deploy }, ethers: { getNamedSigners } }
) {
	const { deployer } = await getNamedSigners();

	const contractInstance = await deploy(contractName, {
		from: deployer.address,
		contract: "ERC20Mock",
		args: [contractName, symbol, supply],
		log: true
	});

	return contractInstance.address;
};
