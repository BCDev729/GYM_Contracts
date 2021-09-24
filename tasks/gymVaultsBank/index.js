const { task } = require("hardhat/config");

task("gymVaultsBank:deposit", "Call deposit function from GymVaultsBank contract", require("./deposit"))
	.addParam("pid", "Pool id")
	.addParam("wantAmt", "Amount of want token for deposit")
	.addParam("referrerId", "referrerId")
	.addParam("minBurnAmt", "minBurnAmt", "0")
	.addParam("deadline", "deadline", "0")
	.addParam("caller", "signer that call the function")
	.addParam("bnbAmount", "bnbAmount", "0");

task(
	"gymVaultsBank:claimAndDeposit",
	"Call claimAndDeposit function from GymVaultsBank contract",
	require("./claimAndDeposit")
)
	.addParam("pid", "Pool id")
	.addParam("amountTokenMin", "amountTokenMin", "0")
	.addParam("amountETHMIn", "amountETHMIn", "0")
	.addParam("minAmountOut", "minAmountOut", "0")
	.addParam("deadline", "deadline", "0")
	.addParam("caller", "signer that call the function");

task(
	"gymVaultsBank:withdraw",
	"Call withdraw function from GymVaultsBank contract",
	require("./withdraw")
)
	.addParam("pid", "Pool id")
	.addParam("wantAmt", "Amount of want token for withdraw")
	.addParam("caller", "signer that call the function");
