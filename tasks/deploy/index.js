const { task } = require("hardhat/config");

task(
	"deploy:greeter",
	"Deploy Greeter contract",
	require("./greeter.deploy")
).addParam("msg", "Hello msg", "Hello to quickStart Project");
