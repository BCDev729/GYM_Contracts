module.exports = async function ({ wantAddress, earnAddress }, { deployments: { deploy }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	await deploy("FarmMock", {
		from: deployer.address,
		contract: "FarmMock",
		args: [wantAddress, earnAddress],
		log: true
	});
};
