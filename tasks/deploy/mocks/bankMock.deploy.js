module.exports = async function ({ msg }, { deployments: { deploy }, ethers: { getNamedSigners } }) {
	const { deployer } = await getNamedSigners();

	await deploy("BankMock", {
		from: deployer.address,
		contract: "BankMock",
		args: [],
		log: true
	});
};
