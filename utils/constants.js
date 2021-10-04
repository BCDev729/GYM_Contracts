const networks = {
	56: "bsc",
	97: "bsc-testnet",
	31337: "hardhat"
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
	getDeploymentArgs
};
