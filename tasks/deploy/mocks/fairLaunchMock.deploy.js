module.exports = async function ({ msg }, { deployments: { deploy }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	await deploy("FairLaunchMock", {
		from: deployer.address,
		contract: "FairLaunchMock",
		args: [],
		log: true
	});
};
