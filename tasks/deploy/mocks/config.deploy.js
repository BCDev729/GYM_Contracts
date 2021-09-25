module.exports = async function ({ wbnbAddress }, { deployments: { deploy }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	await deploy("Config", {
		from: deployer.address,
		contract: "Config",
		args: [wbnbAddress],
		log: true
	});
};
