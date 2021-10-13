/* eslint-disable node/no-unsupported-features/es-syntax */

module.exports = (network) => {
	const length = network.split("-").length;
	if (network.split("-")[length - 1] === "proxy") {
		network = network.slice(0, network.length - 6);
	}
	console.log(network);
	return {
		...require(`./${network}/contracts.json`),
		...require(`./${network}/gymFarming.json`),
		...require(`./${network}/gymMLM.json`),
		...require(`./${network}/gymToken.json`),
		...require(`./${network}/gymVaultsBank.json`),
		...require(`./${network}/gymVaultsStrategyAlpaca.json`),
		...require(`./${network}/mocks.json`)
	};
};
