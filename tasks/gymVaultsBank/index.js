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

task("gymVaultsBank:withdraw", "Call withdraw function from GymVaultsBank contract", require("./withdraw"))
	.addParam("pid", "Pool id")
	.addParam("wantAmt", "Amount of want token for withdraw")
	.addParam("caller", "signer that call the function");

task("gymVaultsBank:set", "Call set function from GymVaultsBank contract", require("./set"))
	.addParam("pid", "Pool id")
	.addParam("allocPoint", "Pool allocation point")
	.addParam("caller", "signer that call the function");

task(
	"gymVaultsBank:resetStrategy",
	"Call resetStrategy function from GymVaultsBank contract",
	require("./resetStrategy")
)
	.addParam("pid", "Pool id")
	.addParam("strategy", "Strategy contract address")
	.addParam("caller", "signer that call the function");

task(
	"gymVaultsBank:migrateStrategy",
	"Call migrateStrategy function from GymVaultsBank contract",
	require("./migrateStrategy")
)
	.addParam("pid", "Pool id")
	.addParam("newStrategy", "Strategy contract address")
	.addParam("caller", "signer that call the function");

task(
	"gymVaultsBank:updateRewardPerBlock",
	"Call updateRewardPerBlock function from GymVaultsBank contract",
	require("./updateRewardPerBlock")
).addParam("caller", "signer that call the function");

task(
	"gymVaultsBank:pendingReward",
	"Call pendingReward function from GymVaultsBank contract",
	require("./pendingReward")
)
	.addParam("pid", "pool id")
	.addParam("user", "user address");

task(
	"gymVaultsBank:stakedWantTokens",
	"Call stakedWantTokens function from GymVaultsBank contract",
	require("./stakedWantTokens")
)
	.addParam("pid", "pool id")
	.addParam("user", "user address");
