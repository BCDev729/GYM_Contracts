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

task("farming:claimAndDeposit", "Call claimAndDeposit function from farming contract", require("./claimAndDeposit"))
	.addParam("pid", "Pool id")
	.addParam("amountAMin", "amountAMin", "0")
	.addParam("amountBMin", "amountBMin", "0")
	.addParam("minAmountOutA", "minAmountOutA", "0")
	.addParam("deadline", "deadline", "0")
	.addParam("caller", "Signer who will call function", "caller")
	.addParam("bnbAmount", "Amount of bnb for speedStake", "0");

task("farming:pendingRewardBlock", "Call pendingRewardBlock from farming contract", require("./pendingRewardBlock"))
	.addParam("user", "caller address", "caller")
	.addParam("caller", "Signer who will call function", "caller");


task("farming:setRewardToken", "Call setRewardToken function from farming contract", require("./setRewardToken"))
	.addParam("token", "Reward token address")
	.addParam("caller", "Signer who will call function", "deployer");

task("farming:setRewardPerBlock", "Call setRewardPerBlock function from farming contract", require("./setRewardPerBlock"))
	.addParam("user", "Signer who will call function", "deployer");

task("farming:getMultiplier", "Call getMultiplier function from farming contract", require("./getMultiplier"))
	.addParam("from", "block from which the reward is calculated", "0")
	.addParam("to", "block before which the reward is calculated", "0")
	.addParam("caller", "Signer who will call function", "caller");

task("farming:pendingReward", "Call pendingReward function from farming contrat", require("./pendingReward"))
	.addParam("pid", "pool ID for which reward must be calculated")
	.addParam("user", "user address for which reward must be calculated", "caller")
	.addParam("caller", "Signer who will call function", "caller");

task("farming:add", "Call add function from farming contrat", require("./add"))
	.addParam("allocPoint", "allocPoint for new pool", "0")
	.addParam("lpToken", "address of lpToken for new pool", "0")
	.addParam("withUpdate", "if true, update all pools", "false")
	.addParam("caller", "Signer who will call function", "deployer");

task("farming:set", "Call set function from farming contract", require("./set"))
	.addParam("pid", "pool ID for which reward must be calculated", "0")
	.addParam("allocPoint", "allocPoint for new pool", "0")
	.addParam("withUpdate", "if true, update all pools", "0")
	.addParam("caller", "Signer who will call function", "deployer");

task("farming:massUpdatePool", "Call massUpdatePool function from farming contract", require("./massUpdatePools"))
	.addParam("caller", "Signer who will call function", "caller");

task("farming:updatePool", "Call updatePool function from farming contract", require("./updatePool"))
	.addParam("pid", "pool ID for which the reward variables should be updated")
	.addParam("caller", "Signer who will call function", "caller");

task("farming:harvest", "Call harvest function from farming contract", require("./harvest"))
	.addParam("pid", "pool ID from which the accumulated reward tokens should be received")
	.addParam("caller", "Signer who will call function", "caller");

task("farming:harvestAll", "Call harvestAll function from farming contract", require("./harvestAll"))
	.addParam("caller", "Signer who will call function", "caller");

task("farming:withdraw", "Call withdraw function from framing contract", require("./withdraw"))
	.addParam("pid", "pool ID from which the LP tokens should be withdrawn")
	.addParam("amount", "the amount of LP tokens that should be withdrawn", "0")
	.addParam("caller", "Signer who will call function", "caller");

task("farming:deposit", "Call deposite function from farming contract", require("./deposit"))
	.addParam("pid", "pool ID from which the LP tokens should be withdrawn")
	.addParam("amount", "the amount of LP tokens that should be withdrawn", "0")
	.addParam("caller", "Signer who will call function", "caller");

task("farming:poolLength", "Call poolLength function from farming contract", require("./poolLenghth"))
	.addParam("caller", "Signer who will call function", "caller");
