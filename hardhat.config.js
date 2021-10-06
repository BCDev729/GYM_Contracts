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

const network = require("./network.json");
const getNetwork = function () {
	const args = process.argv.slice(2);
	const networkIndex = args.findIndex((el, i, arr) => {
		return arr[i - 1] === "--network";
	});
	return networkIndex === -1 ? "hardhat" : args[networkIndex];
};

const getSolppDefs = function () {
	if (getNetwork() === "hardhat"){
		if(!network.networks.hardhat.forking.enabled){
			return require("./utils/constants/solpp")(getNetwork());
		}else{
			return require("./utils/constants/solpp")("fork");
		}
	}
	return require("./utils/constants/solpp")(getNetwork());
};


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT || "";
const TENDERLY_USERNAME = process.env.TENDERLY_USERNAME || "";

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
		deployer: {
			default: 0
		},
		owner: {
			default: 1
		},
		caller: {
			default: 2
		},
		holder: {
			default: 3
		},
		vzgo: {
			default: 4
		},
		grno: {
			default: 5
		},
		toni: {
			default: 6
		},
		chugun: {
			default: 7
		},
		shumi: {
			default: 8
		},
		ningi: {
			default: 9
		},
		andon: {
			default: 10
		},
		valod: {
			default: 11
		},
		aroka: {
			default: 12
		},
		mto: {
			default: 13
		},
		benik: {
			default: 14
		},
		samoka: {
			default: 15
		},
		arni: {
			default: 16
		},
		babken: {
			default: 17
		}
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
	localNetworksConfig: `${process.cwd()}/network.json`,
	gasReporter: {
		coinmarketcap: COINMARKETCAP_API_KEY,
		enabled: process.env.REPORT_GAS !== undefined,
		currency: "USD",
		showMethodSig: false,
		showTimeSpent: true
	},
	etherscan: {
		apiKey: "6ce6d20a-db6a-46e5-8fa5-9c4b16ec7549"
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
	},
	mocha: {
		timeout: 100000
	}
};
