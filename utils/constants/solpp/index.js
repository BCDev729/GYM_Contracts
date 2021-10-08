/* eslint-disable node/no-unsupported-features/es-syntax */

module.exports = (network) => {
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
