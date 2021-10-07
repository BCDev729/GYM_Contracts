const { normalizeHardhatNetworkAccountsConfig } = require("hardhat/internal/core/providers/util");

const { BN, bufferToHex, privateToAddress, toBuffer } = require("ethereumjs-util");

const getNetwork = function () {
	const args = process.argv.slice(2);
	const networkIndex = args.findIndex((el, i, arr) => {
		return arr[i - 1] === "--network";
	});
	return networkIndex === -1 ? "hardhat" : args[networkIndex];
};

module.exports = async function (taskArguments, hre) {
	const networkConfig = hre.config.networks[getNetwork()];

	const accounts = normalizeHardhatNetworkAccountsConfig(networkConfig.accounts);

	console.log("Accounts");
	console.log("========");

	for (const [index, account] of accounts.entries()) {
		const address = bufferToHex(privateToAddress(toBuffer(account.privateKey)));
		const privateKey = bufferToHex(toBuffer(account.privateKey));
		const balance = new BN(account.balance).div(new BN(10).pow(new BN(18))).toString(10);
		console.log(`Account #${index}: ${address} (${balance} ETH)
Private Key: ${privateKey}
`);
	}
};
