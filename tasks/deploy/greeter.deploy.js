module.exports = async function ({ msg }, { deployments: { deploy }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	await deploy("Greeter", {
		from: deployer.address,
		contract: "Greeter",
		args: [msg],
		log: true
	});
};
