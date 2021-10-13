module.exports = async function ({ run }) {
	await run("deploy:gymMLM");
};
module.exports.tags = ["GymMLM", "Hardhat", "Fork", "bsc", "bsc-testnet", "layer1", "Proxy"];
