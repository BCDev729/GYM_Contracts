const { task } = require("hardhat/config");

task("deploy:strategyMock", "strategyMock deploy", require("./strategy.deploy"))
	.addParam("contractName", "name Of contract")
	.addParam("wantAddress", "strategy want token address");

task("deploy:config", "Config deploy", require("./config.deploy"))
	.addParam("wbnbAddress", "WBNB address");

task("deploy:bankMock", "bankMock deploy", require("./bankMock.deploy"));
