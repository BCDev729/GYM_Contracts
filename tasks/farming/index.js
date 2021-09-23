const { task } = require("hardhat/config");

task("farming:speedStake", "Call speedStake function from farming contract", require("./speedStake"))
	.addParam("pid", "Pool id")
	.addParam("tokenAmount", "Amount of token for speedStake", "0")
	.addParam("amountAMin", "amountAMin", "0")
	.addParam("amountBMin", "amountBMin", "0")
	.addParam("minAmountOutA", "minAmountOutA", "0")
	.addParam("deadline", "deadline", "0")
	.addParam("caller", "Signer who will call function", "caller")
	.addParam("bnbAmount", "Amount of bnb for speedStake", "0");
