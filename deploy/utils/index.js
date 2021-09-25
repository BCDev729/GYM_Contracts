function printDeployInfo(contractName, contractAddress, chainId, owner) {
	console.log(`${contractName} deployed at: ${contractAddress} address, on chainID: ${chainId}`);
	console.log(`${contractName}'s owner: ${owner}`);
}

async function contractDeploy(
	{ ethers, upgrades, deployments, getNamedAccounts, ethernal, getChainId },
	options,
	callback = () => {}
) {
	const { deploy } = deployments;
	const chainId = await getChainId();
	const { deployer } = await getNamedAccounts();

	if (typeof options === "string") {
		options = {
			contractName: options,
			contractFactory: options,
			isUpgrade: false,
			args: []
		};
	}

	options = {
		contractName: options.contractName,
		contractFactory: options.contractFactory,
		isUpgrade: options.isUpgrade || false,
		isProxy: options.isProxy || false,
		args: options.args || [],
		owner: options.owner || deployer
	};

	let contract;

	if (chainId !== "31337") {
		if (options.isProxy) {
			const ContractFactory = await ethers.getContractFactory(options.contractFactory);
			contract = await upgrades.deployProxy(ContractFactory, [...options.args]);

			await contract.deployed();

			await callback(contract);
			printDeployInfo(options.contractName, contract.address, chainId, deployer);

			return;
		}

		await deploy(options.contractName, {
			from: deployer,
			contract: options.contractFactory,
			args: [...options.args],
			log: true,
			deterministicDeployment: false
		});

		contract = await ethers.getContract(options.contractName, deployer);

		await callback(contract);
		printDeployInfo(options.contractName, contract.address, chainId, deployer);
		return;
	}
	await deploy(options.contractName, {
		from: deployer,
		contract: options.contractFactory,
		args: [...options.args],
		log: true,
		deterministicDeployment: false
	});
	contract = await ethers.getContract(options.contractName, deployer);

	if (typeof contract.transferOwnership === "function" && (await contract.owner()) !== options.owner) {
		// Transfer ownership of contract to owner
		await contract.transferOwnership(options.owner);
	}

	await callback(contract);
	// printDeployInfo(options.contractName, contract.address, chainId, contractOwner)
	if (process.env.IS_ETHERNAL_ON === "true") {
		await ethernal.push({
			name: options.contractName,
			address: contract.address
		});
	}
}

module.exports = { contractDeploy };
