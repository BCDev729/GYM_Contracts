const { task } = require("hardhat/config");

task("deploy:strategyMock", "strategyMock deploy", require("./strategy.deploy"))
	.addParam("contractName", "name Of contract")
	.addParam("wantAddress", "strategy want token address");
