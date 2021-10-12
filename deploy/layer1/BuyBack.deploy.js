module.exports = async function ({ run }) {
	await run("deploy:buyBack");
};
module.exports.tags = ["BuyBack", "Hardhat", "Fork", "bsc", "bsc-testnet", "layer1", "Proxy"];
module.exports.dependencies = [];
