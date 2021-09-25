module.exports = async function (
	{ wantAddress },
	{ deployments: { deploy }, ethers: { getNamedSigners } }
) {
	const { deployer } = await getNamedSigners();

	const contractInstance = await deploy("VaultMock", {
		from: deployer.address,
		contract: "VaultMock",
		args: [wantAddress],
		log: true
	});

	return contractInstance.address;
};
