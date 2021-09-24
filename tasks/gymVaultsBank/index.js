const { task } = require("hardhat/config");

task("gymVaultsBank:deposit", "Call deposit function from GymVaultsBank contract", require("./deposit"))
	.addParam("pid", "Pool id")
	.addParam("wantAmt", "Amount of want token for deposit")
	.addParam("referrerId", "referrerId")
	.addParam("minBurnAmt", "minBurnAmt", "0")
	.addParam("deadline", "deadline", "0")
	.addParam("caller", "signer that call the function")
	.addParam("bnbAmount", "bnbAmount", "0");
