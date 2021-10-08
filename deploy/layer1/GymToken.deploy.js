module.exports = async function ({ run, getNamedAccounts }) {
	const { holder } = await getNamedAccounts();

	await run("deploy:gymToken", {
		holder: holder
	});
};
module.exports.tags = ["GymToken", "Hardhat", "Fork", "bsc", "bsc-testnet", "layer1"];
