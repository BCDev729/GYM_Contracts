const { task } = require("hardhat/config");

task(
	"deploy:greeter",
	"Deploy Greeter contract",
	require("./greeter.deploy")
).addParam("msg", "Hello msg", "Hello to quickStart Project");

task(
	"deploy:buyBack",
	"Deploy BuyBack contract",
	require("./buyBack.deploy")
);

task(
	"deploy:gymToken",
	"Deploy GymToken contract",
	require("./gymToken.deploy")
).addParam("holder", "Holder address");