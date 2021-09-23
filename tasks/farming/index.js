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

task("farming:autoDeposit", "Call autoDeposit function from farming contract", require("./autoDeposit"))
	.addParam("pid", "Pool id")
	.addParam("amount", "Amount of token for speedStake", "0")
	.addParam("amountTokenMin", "amountTokenMin", "0")
	.addParam("amountBNBMin", "amountBNBMin", "0")
	.addParam("minAmountOutA", "minAmountOutA", "0")
	.addParam("recipient", "recipient", "holder")
	.addParam("deadline", "deadline", "0")
	.addParam("caller", "Signer who will call function", "caller")
	.addParam("bnbAmount", "Amount of bnb for speedStake", "0");
