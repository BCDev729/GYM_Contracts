const { advanceBlock, advanceBlockTo, increase, latest, advanceTimeAndBlock, duration } = require("./time");

const { ethers } = require("hardhat");

const BASE_TEN = 10;

function getBigNumber(amount, decimals = 18) {
	return ethers.BigNumber.from(amount).mul(ethers.BigNumber.from(BASE_TEN).pow(decimals));
}

async function deploy(thisObject, contracts) {
	for (const i in contracts) {
		const contract = contracts[i];
		thisObject[contract[0]] = await contract[1].deploy(...(contract[2] || []));
		await thisObject[contract[0]].deployed();
	}
}

async function prepare(thisObject, contracts) {
	for (const i in contracts) {
		const contract = contracts[i];
		thisObject[contract] = await ethers.getContractFactory(contract);
	}
	thisObject.signers = await ethers.getSigners();
	thisObject.alice = thisObject.signers[0];
	thisObject.bob = thisObject.signers[1];
	thisObject.carol = thisObject.signers[2];
	thisObject.dev = thisObject.signers[3];
	thisObject.alicePrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
	thisObject.bobPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
	thisObject.carolPrivateKey = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
}

module.exports = {
	advanceBlock,
	advanceBlockTo,
	increase,
	latest,
	advanceTimeAndBlock,
	duration,
	prepare,
	deploy,
	getBigNumber,
};
