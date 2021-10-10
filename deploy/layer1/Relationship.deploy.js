module.exports = async function ({ run }) {
	const tx = await run("deploy:gymMLM");
	console.log("🚀 ~ file: Relationship.deploy.js ~ line 3 ~ tx", tx.address);
};
module.exports.tags = ["GymMLM", "Hardhat", "Fork", "bsc", "bsc-testnet", "layer1"];
