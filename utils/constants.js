const directReferralBonuses = [10, 7, 5, 4, 4, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1];

const networks = {
	56: "bsc",
	97: "bsc-testnet",
	31337: "hardhat"
};

const VARIABLES = {
	bsc: {
		buyBack: [
			60 // deadline
		],
		gymToken: [
			"\"GYM TOKEN\"", // name
			"\"GYM\"", // symbol
			18, // decimals
			"600000000000000000000000000" // totalSupply
		],
		gymMLM: [
			directReferralBonuses,
			directReferralBonuses.length,
			"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // owner
		],
		gymVaultsBank: [
			45, // RELATIONSHIP_REWARD
			45, // VAULTS_SAVING
			10, // BUY_AND_BURN_GYM
			10000, // WITHDRAW_FEE_FACTOR_MAX
			0, // CORE_POOL_ID
			20, // block number to change rewardPerBlock
			3, // times can rewardPerBlock be changed
			972222222200, // coefficient
			"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // owner
		],
		gymVaultsStrategy: [
			0, // controllerFee
			10000, // controllerFeeMax
			300, // controllerFeeUL
			10000, // entranceFeeFactor
			10000, // entranceFeeFactorMax
			9950, // entranceFeeFactorLL
			60 // deadline
		],
		gymVaultsStrategyAlpaca: [
			0, // controllerFee
			10000, // controllerFeeMax
			300, // controllerFeeUL
			10000, // entranceFeeFactor
			10000, // entranceFeeFactorMax
			9950 // entranceFeeFactorLL
		],
		gymFarming: [
			972222222200, // coefficient
			3, // times can rewardPerBlock be changed
			20, // block number to change rewardPerBlock
			"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // owner
			1 // liquidityProviderApiId
		],

		/// contract addresses
		contracts: [
			"0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeRouter
			"0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F", // Alpaca token
			"0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB token. want address
			"0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F", // Alpaca FairLaunch
			"0xd7D069493685A581d27824Fc46EdA46B7EfC0063", // FairLaunch Vault

			"0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD
			"0x53dbb71303ad0F9AFa184B8f7147F9f12Bb5Dc01", // Alpaca Vault Config address
			"0xAd3E631c01798f9aAE4692dabF791a62c226C5D4", // RelationShip
			"0x0Ac85d55ebFc7f7b0cF4c13bb3BD6Eaf3909d62d", // buyBack
			"0x2B1C93fFfF55E2620D6fb5DaD7D69A6a468C9731" // LiquidityProvider
		],
		// FAIR_LAUNCH_MOCK
		FAIR_LAUNCH_VAULT_ADDRESS: "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07",
		GYM_VAULTS_STRATEGY_ALPACA_VAULT_CONFIG_ADDRESS: "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07", // wrong address to compile
		FAIR_LAUNCH_MOCK_EARN_TOKEN_ADDRESS: "0x82e01223d51Eb87e16A03E24687EDF0F294da6f1",
		FAIR_LAUNCH_RETURN_AMOUNT: 500, // FairLaunch mock harvest returns amount
		// FARM_MOCK
		FARM_MOCK_RETURN_AMOUNT: 10000,
		// ROUTER_MOCK
		ROUTER_MOCK_RETURN_AMOUNT: 10000
	},
	"bsc-testnet": {
		buyBack: [
			120 // deadline
		],
		gymToken: [
			"\"GYM TOKEN\"", // name
			"\"GYM\"", // symbol
			18, // decimals
			"600000000000000000000000000" // totalSupply
		],
		gymMLM: [
			directReferralBonuses,
			directReferralBonuses.length,
			"0x5f2cFa351B7d4b973d341fdB2cB154794c0a899c" // owner
		],
		gymVaultsBank: [
			45, // RELATIONSHIP_REWARD
			45, // VAULTS_SAVING
			10, // BUY_AND_BURN_GYM
			10000, // WITHDRAW_FEE_FACTOR_MAX
			0, // CORE_POOL_ID
			20, // block number to change rewardPerBlock
			3, // times can rewardPerBlock be changed
			972222222200, // coefficient
			"0x5f2cFa351B7d4b973d341fdB2cB154794c0a899c" // owner
		],
		gymVaultsStrategy: [
			0, // controllerFee
			10000, // controllerFeeMax
			300, // controllerFeeUL
			10000, // entranceFeeFactor
			10000, // entranceFeeFactorMax
			9950, // entranceFeeFactorLL
			60 // deadline
		],
		gymVaultsStrategyAlpaca: [
			0, // controllerFee
			10000, // controllerFeeMax
			300, // controllerFeeUL
			10000, // entranceFeeFactor
			10000, // entranceFeeFactorMax
			9950 // entranceFeeFactorLL
		],
		gymFarming: [
			972222222200, // coefficient
			3, // times can rewardPerBlock be changed
			20, // block number to change rewardPerBlock
			"0x5f2cFa351B7d4b973d341fdB2cB154794c0a899c", // owner
			2 // liquidityProviderApiId
		],

		/// contract addresses
		contracts: [
			"0x367633909278A3C91f4cB130D8e56382F00D1071", // PancakeRouter
			"0x354b3a11D5Ea2DA89405173977E271F58bE2897D", // Alpaca token
			"0xDfb1211E2694193df5765d54350e1145FD2404A1", // WBNB token. want address
			"0xac2fefDaF83285EA016BE3f5f1fb039eb800F43D", // Alpaca FairLaunch
			"0xf9d32C5E10Dd51511894b360e6bD39D7573450F9", // FairLaunch Vault

			"0x0266693F9Df932aD7dA8a9b44C2129Ce8a87E81f", // BUSD
			"0x037F4b0d074B83d075EC3B955F69BaB9977bdb05", // Alpaca Vault Config address

			"0xF07eB2741CFF5e6387f6c94857cc56F86E42280B", // RelationShip
			"0xC55cA98EAE344a610271B846524DCe54487FfBe9", // buyBack
			"0xED2056Cff3e8408c0934D203a26c082E7ced7a97" // LiquidityProvider
		],
		// FAIR_LAUNCH_MOCK
		FAIR_LAUNCH_VAULT_ADDRESS: "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07",
		GYM_VAULTS_STRATEGY_ALPACA_VAULT_CONFIG_ADDRESS: "0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07", // wrong address to compile
		FAIR_LAUNCH_MOCK_EARN_TOKEN_ADDRESS: "0x82e01223d51Eb87e16A03E24687EDF0F294da6f1",
		FAIR_LAUNCH_RETURN_AMOUNT: 500, // FairLaunch mock harvest returns amount
		// FARM_MOCK
		FARM_MOCK_RETURN_AMOUNT: 10000,
		// ROUTER_MOCK
		ROUTER_MOCK_RETURN_AMOUNT: 10000
	},
	hardhat: {
		buyBack: [
			60 // deadline
		],
		gymToken: [
			"\"GYM TOKEN\"", // name
			"\"GYM\"", // symbol
			18, // decimals
			"600000000000000000000000000" // totalSupply
		],
		gymMLM: [
			directReferralBonuses,
			directReferralBonuses.length,
			"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // owner
		],
		gymVaultsBank: [
			45, // RELATIONSHIP_REWARD
			45, // VAULTS_SAVING
			10, // BUY_AND_BURN_GYM
			10000, // WITHDRAW_FEE_FACTOR_MAX
			0, // CORE_POOL_ID
			20, // block number to change rewardPerBlock
			3, // times can rewardPerBlock be changed
			972222222200, // coefficient
			"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // owner
		],
		gymVaultsStrategy: [
			0, // controllerFee
			10000, // controllerFeeMax
			300, // controllerFeeUL
			10000, // entranceFeeFactor
			10000, // entranceFeeFactorMax
			9950, // entranceFeeFactorLL
			60 // deadline
		],
		gymVaultsStrategyAlpaca: [
			0, // controllerFee
			10000, // controllerFeeMax
			300, // controllerFeeUL
			10000, // entranceFeeFactor
			10000, // entranceFeeFactorMax
			9950 // entranceFeeFactorLL
		],
		gymFarming: [
			972222222200, // coefficient
			3, // times can rewardPerBlock be changed
			20, // block number to change rewardPerBlock
			"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // owner
			0 // liquidityProviderApiId
		],

		/// contract addresses
		contracts: [
			"0x610178dA211FEF7D417bC0e6FeD39F05609AD788", // PancakeRouter
			"0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Alpaca token
			"0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", // WBNB token. want address
			"0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", // Alpaca FairLaunch
			"0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1", // FairLaunch Vault
			"0x0266693F9Df932aD7dA8a9b44C2129Ce8a87E81f", // BUSD
			"0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6", // Alpaca Vault Config address
			"0xc6e7DF5E7b4f2A278906862b61205850344D4e7d", // RelationShip
			"0x3Aa5ebB10DC797CAC828524e59A333d0A371443c", // buyBack
			"0x2B1C93fFfF55E2620D6fb5DaD7D69A6a468C9731" // LiquidityProvider
		],
		// FAIR_LAUNCH_MOCK
		FAIR_LAUNCH_VAULT_ADDRESS: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
		GYM_VAULTS_STRATEGY_ALPACA_VAULT_CONFIG_ADDRESS: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
		FAIR_LAUNCH_MOCK_EARN_TOKEN_ADDRESS: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
		FAIR_LAUNCH_RETURN_AMOUNT: 500, // FairLaunch mock harvest returns amount
		// FARM_MOCK
		FARM_MOCK_RETURN_AMOUNT: 10000,
		// ROUTER_MOCK
		ROUTER_MOCK_RETURN_AMOUNT: 10000,
		// TEST_VARIABLES
		TEST_TOKENS_MINT_AMOUNT: 100000000000, // for TokensMock
		TEST_TX_AMOUNT: 10000, // tx amount in tests
		TEST_FEE: 200, // 100 = 1%, < 300, Strategy test
		TEST_AMOUNT: 100,
		TEST_WANTTOKEN1_AMOUNT: 100000,
		TEST_WANTTOKEN2_AMOUNT: 100000,
		TEST_REWARDTOKEN_MINT_AMOUNT: 20000,
		TEST_GYMTOKEN_BANKS_BALANCE: 2000,
		TEST_REWARDTOKEN_BANKS_BALANCE: 5000,
		TEST_BLOCK_COUNT: 30,
		TEST_BLOCK_COUNT_TO_REVERT: 15,
		TEST_BLOCK_COUNT_FOR_SAFETRANSFER: 1000,
		TEST_CORE_REWARDPOOL_REWARDPERBLOCK: 10,
		TEST_UPDATED_REWARDPOOL1_REWARDPERBLOCK: 100,
		TEST_REWARDPERBLOCK: 100, // intermediate value which will be changed in next it
		TEST_STARTBLOCK: 100,
		TEST_RELATIONSHIP_REWARD: 40,
		TEST_BUY_AND_BURN_GYM: 10,
		TEST_VAULTS_SAVING: 50,
		TEST_MOCK_RETURN_AMOUNT: 10000,
		TEST_FAIR_LAUNCH_RETURN_AMOUNT: 500,
		TEST_CHEF_TX_AMOUNT: "10",
		DEADLINE: 10
	}
};

async function getDeploymentArgs(chainId, contractName) {
	let gymTokenAddress, gymVaultsBankAddress;
	try {
		gymTokenAddress = (await ethers.getContract("GymToken")).address;
	} catch (e) {
		console.log(e);
	}

	try {
		gymVaultsBankAddress = (await ethers.getContract("GymVaultsBank")).address;
	} catch (e) {
		console.log(e);
	}

	const blockNumber = await ethers.provider.getBlockNumber();
	const { holder } = await getNamedAccounts();

	const deploymentArgs = {
		bsc: {
			GymToken: {
				holder: holder
			},
			GymVaultsBank: {
				startBlock: blockNumber + 200,
				gymTokenAddress: gymTokenAddress,
				rewardRate: ethers.utils.parseEther("25.72864")
			},
			GymFarming: {
				bank: gymVaultsBankAddress,
				rewardToken: gymTokenAddress,
				rewardPerBlock: ethers.utils.parseEther("25.72864"),
				startBlock: blockNumber + 100
			},
			GymVaultsStrategy: {
				bank: gymVaultsBankAddress,
				isCAKEStaking: false,
				isAutoComp: false,
				farm: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				pid: 0,
				router: "0x367633909278A3C91f4cB130D8e56382F00D1071",
				want: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				earn: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				tokenA: ["0xf9d32C5E10Dd51511894b360e6bD39D7573450F9", "0x0000000000000000000000000000000000000000"],
				tokenB: ["0xf9d32C5E10Dd51511894b360e6bD39D7573450F9", "0x0000000000000000000000000000000000000000"],
				owner: gymVaultsBankAddress
			},
			GymVaultsStrategyAlpaca: {
				bank: gymVaultsBankAddress,
				isAutoComp: true,
				vault: "0xd7D069493685A581d27824Fc46EdA46B7EfC0063",
				fairLaunch: "0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F",
				pid: 1,
				want: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
				earn: "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
				router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
				owner: gymVaultsBankAddress
			},
			GymVaultsStrategyAlpacaBUSD: {
				bank: gymVaultsBankAddress,
				isAutoComp: true,
				vault: "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f",
				fairLaunch: "0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F",
				pid: 3,
				want: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
				earn: "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
				router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
				owner: gymVaultsBankAddress
			},

			GymMLM: {
				bank: gymVaultsBankAddress
			}
		},
		"bsc-testnet": {
			GymToken: {
				holder: holder
			},
			GymVaultsBank: {
				startBlock: blockNumber + 150,
				gymTokenAddress: gymTokenAddress,
				rewardRate: ethers.utils.parseEther("25.72864")
			},
			GymFarming: {
				bank: gymVaultsBankAddress,
				rewardToken: gymTokenAddress,
				rewardPerBlock: ethers.utils.parseEther("25.72864"),
				startBlock: blockNumber + 100
			},
			GymVaultsStrategy: {
				bank: gymVaultsBankAddress,
				isCAKEStaking: false,
				isAutoComp: false,
				farm: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				pid: 0,
				router: "0x367633909278A3C91f4cB130D8e56382F00D1071",
				want: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				earn: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				tokenA: ["0xf9d32C5E10Dd51511894b360e6bD39D7573450F9", "0x0000000000000000000000000000000000000000"],
				tokenB: ["0xf9d32C5E10Dd51511894b360e6bD39D7573450F9", "0x0000000000000000000000000000000000000000"],
				owner: gymVaultsBankAddress
			},
			GymVaultsStrategyAlpaca: {
				bank: gymVaultsBankAddress,
				isAutoComp: true,
				vault: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				fairLaunch: "0xac2fefDaF83285EA016BE3f5f1fb039eb800F43D",
				pid: 1,
				want: "0xDfb1211E2694193df5765d54350e1145FD2404A1", // 0x0266693F9Df932aD7dA8a9b44C2129Ce8a87E81f
				earn: "0x354b3a11D5Ea2DA89405173977E271F58bE2897D",
				router: "0x367633909278A3C91f4cB130D8e56382F00D1071",
				owner: gymVaultsBankAddress
			},
			GymVaultsStrategyAlpacaBUSD: {
				bank: gymVaultsBankAddress,
				isAutoComp: true,
				vault: "0xe5ed8148fE4915cE857FC648b9BdEF8Bb9491Fa5",
				fairLaunch: "0xac2fefDaF83285EA016BE3f5f1fb039eb800F43D",
				pid: 3,
				want: "0x0266693F9Df932aD7dA8a9b44C2129Ce8a87E81f",
				earn: "0x354b3a11D5Ea2DA89405173977E271F58bE2897D",
				router: "0x367633909278A3C91f4cB130D8e56382F00D1071",
				owner: gymVaultsBankAddress
			},
			GymMLM: {
				bank: gymVaultsBankAddress
			}
		},
		hardhat: {
			GymToken: {
				holder: holder
			},
			GymVaultsBank: {
				startBlock: blockNumber + 100,
				gymTokenAddress: gymTokenAddress,
				rewardRate: ethers.utils.parseEther("25.72864")
			},
			GymFarming: {
				bank: gymVaultsBankAddress,
				rewardToken: gymTokenAddress,
				rewardPerBlock: ethers.utils.parseEther("25.72864"),
				startBlock: blockNumber + 100
			},
			GymVaultsStrategy: {
				bank: gymVaultsBankAddress,
				isCAKEStaking: false,
				isAutoComp: false,
				farm: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				pid: 0,
				router: "0x367633909278A3C91f4cB130D8e56382F00D1071",
				want: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				earn: "0xf9d32C5E10Dd51511894b360e6bD39D7573450F9",
				tokenA: ["0xf9d32C5E10Dd51511894b360e6bD39D7573450F9", "0x0000000000000000000000000000000000000000"],
				tokenB: ["0xf9d32C5E10Dd51511894b360e6bD39D7573450F9", "0x0000000000000000000000000000000000000000"],
				owner: gymVaultsBankAddress
			},
			GymVaultsStrategyAlpaca: {
				bank: gymVaultsBankAddress,
				isAutoComp: true,
				vault: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
				fairLaunch: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
				pid: 1,
				want: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
				earn: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
				router: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
				owner: gymVaultsBankAddress
			},
			GymVaultsStrategyAlpacaBUSD: {
				bank: gymVaultsBankAddress,
				isAutoComp: true,
				vault: "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f",
				fairLaunch: "0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F",
				pid: 3,
				want: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
				earn: "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F",
				router: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
				owner: gymVaultsBankAddress
			},
			GymMLM: {
				bank: gymVaultsBankAddress
			}
		}
	};

	return deploymentArgs[networks[chainId]][contractName];
}
module.exports = {
	VARIABLES,
	getDeploymentArgs
};
