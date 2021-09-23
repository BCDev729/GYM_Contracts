const { expect } = require("chai");
const {
	ethers: { getContract },
	deployments: { fixture }
} = require("hardhat");

describe("Greeter", function () {
	it("Should return the new greeting once it's changed", async function () {
		await fixture(["Greeter"]);
		const greeter = await getContract("Greeter");

		const greeting = await greeter.greet();

		expect(greeting).to.equal("Hello, world!");

		await greeter.setGreeting("Hola, mundo!");

		expect(await greeter.greet()).to.equal("Hola, mundo!");
	});
});
