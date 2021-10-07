module.exports = async function (
	{ wantAddress },
	{ deployments: { deploy }, ethers: { getNamedSigners } }
) {
	const { deployer } = await getNamedSigners();

	await deploy("RouterMock", {
		from: deployer.address,
		contract: "RouterMock",
		args: [wantAddress],
		log: true
	});
};
