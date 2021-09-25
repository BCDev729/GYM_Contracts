const { task } = require("hardhat/config");

task("deploy:strategyMock", "strategyMock deploy", require("./strategy.deploy"))
	.addParam("contractName", "name Of contract")
	.addParam("wantAddress", "strategy want token address");

task("deploy:tokensMock", "tokensMock deploy", require("./tokensMock.deploy"))
	.addParam("contractName", "name Of contract")
	.addParam("symbol", "symbol")
	.addParam("supply", "supply");

task("deploy:farmMock", "farmMock deploy", require("./farmMock.deploy"))
	.addParam("wantAddress", "want token address")
	.addParam("earnAddress", "earn token address");

task("deploy:config", "Config deploy", require("./config.deploy")).addParam("wbnbAddress", "WBNB address");

task("deploy:routerMock", "RouterMock deploy", require("./routerMock.deploy")).addParam(
	"wantAddress",
	"want token address"
);

task("deploy:vaultMock", "VaultMock deploy", require("./vaultMock.deploy")).addParam(
	"wantAddress",
	"want token address"
);

task("deploy:bankMock", "bankMock deploy", require("./bankMock.deploy"));

task("deploy:fairLaunchMock", "fairLaunchMock deploy", require("./fairLaunchMock.deploy"));
