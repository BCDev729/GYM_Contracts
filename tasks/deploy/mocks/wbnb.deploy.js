module.exports = async function ({ msg }, { deployments: { deploy }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	await deploy("WBNBMock", {
		from: deployer.address,
		contract: "WBNBMock",
		args: [],
		log: true
	});
};
