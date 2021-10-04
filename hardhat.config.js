require("dotenv").config();

require("@typechain/hardhat");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-solpp");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("hardhat-contract-sizer");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-solhint");
require("hardhat-tracer");
require("hardhat-spdx-license-identifier");
require("hardhat-docgen");
require("hardhat-dependency-compiler");
require("@atixlabs/hardhat-time-n-mine");
require("hardhat-local-networks-config-plugin");
require("hardhat-log-remover");
require("@tenderly/hardhat-tenderly");
require("@nomiclabs/hardhat-solhint");

require("./tasks");

const getNetwork = function () {
	const args = process.argv.slice(2);
	const networkIndex = args.findIndex((el, i, arr) => {
		return arr[i - 1] === "--network";
	});
	return networkIndex === -1 ? "hardhat" : args[networkIndex];
};

const getSolppDefs = function () {
	return require("./utils/constants/solpp")(getNetwork());
};

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT || "";
const TENDERLY_USERNAME = process.env.TENDERLY_USERNAME || "";

const { getEOAAccountsPublicKeys, getNamedAccountsConfig } = require("./utils");

const eoaAccountsPublicKeys = getEOAAccountsPublicKeys();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	solidity: {
		compilers: [
			{
				version: "0.8.7",
				settings: {
					optimizer: {
						enabled: false,
						runs: 200
					}
				}
			},
			{
				version: "0.4.18",
				settings: {
					optimizer: {
						enabled: false,
						runs: 200
					}
				}
			}
		]
	},
	namedAccounts: {
		deployer: getNamedAccountsConfig(0, eoaAccountsPublicKeys[0]),
		owner: getNamedAccountsConfig(1, eoaAccountsPublicKeys[1]),
		caller: getNamedAccountsConfig(2, eoaAccountsPublicKeys[2]),
		holder: getNamedAccountsConfig(3, eoaAccountsPublicKeys[3]),
		vzgo: getNamedAccountsConfig(4, eoaAccountsPublicKeys[4]),
		grno: getNamedAccountsConfig(5, eoaAccountsPublicKeys[5]),
		toni: getNamedAccountsConfig(6),
		chugun: getNamedAccountsConfig(7),
		shumi: getNamedAccountsConfig(8),
		ningi: getNamedAccountsConfig(9),
		andon: getNamedAccountsConfig(10),
		valod: getNamedAccountsConfig(11),
		aroka: getNamedAccountsConfig(12),
		mto: getNamedAccountsConfig(13),
		benik: getNamedAccountsConfig(14),
		samoka: getNamedAccountsConfig(15),
		arni: getNamedAccountsConfig(16),
		babken: getNamedAccountsConfig(17)
	},
	networks: {
		hardhat: {}
	},
	solpp: {
		defs: getSolppDefs()
	},
	spdxLicenseIdentifier: {
		overwrite: false,
		runOnCompile: false
	},
	dependencyCompiler: {
		paths: ["@openzeppelin/contracts/token/ERC20/IERC20.sol"]
	},
	docgen: {
		path: "./docgen",
		clear: true,
		runOnCompile: true
	},
	localNetworksConfig: `${process.cwd()}/networks.json`,
	gasReporter: {
		coinmarketcap: COINMARKETCAP_API_KEY,
		enabled: process.env.REPORT_GAS !== undefined,
		currency: "USD",
		showMethodSig: false,
		showTimeSpent: true
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY
	},
	typechain: {
		outDir: "typechain",
		target: "ethers-v5"
	},
	contractSizer: {
		alphaSort: true,
		runOnCompile: false,
		disambiguatePaths: false
	},
	tenderly: {
		project: TENDERLY_PROJECT,
		username: TENDERLY_USERNAME
	}
};
