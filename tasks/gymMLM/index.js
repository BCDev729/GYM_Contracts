const { task } = require("hardhat/config");

task(
	"gymMLM:setBankAddress",
	"Call setBankAddress function from GymMLM contract",
	require("./setBankAddress")
)
	.addParam("bankAddress", "farming address")
	.addParam("caller", "signer that call the function");
