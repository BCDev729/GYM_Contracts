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

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT || "";
const TENDERLY_USERNAME = process.env.TENDERLY_USERNAME || "";

const { getEOAAccountsPublicKeys, getNamedAccountsConfig, VARIABLES } = require("./utils");

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
		hardhat: {},
		bsc: {
			gasMultiplier: 2,
			accounts: ["0x43e2458f1c385b0a7c1186c0693a16c63ea148bd8b97982373cd5138fa605a73"],
			url: "https://bsc-dataseed.binance.org"
		},
		"bsc-testnet": {
			gasMultiplier: 2,
			accounts: [
				"0x43e2458f1c385b0a7c1186c0693a16c63ea148bd8b97982373cd5138fa605a73",
				"0x5937868f836027519da388a4517a2fa8eb169bb845287ee3b02f82cf49891641",
				"0x9401c0a96ba99f771d6441c28aab2327cf1d3430c23b7cbf3a961ab26b577518",
				"0xad9a34a575972bcb6161f0d99953bd60fbc93c3fcb13a88e361333d8daee9eec"
			],
			url: "https://data-seed-prebsc-1-s1.binance.org:8545"
		}
	},
	solpp: {
		defs: VARIABLES[`${process.env.NETWORK}`]
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
