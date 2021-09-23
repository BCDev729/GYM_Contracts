module.exports = async ({ run }) => {
	await run("deploy:greeter", {
		msg: "Hello, world!"
	});
};
module.exports.tags = ["Greeter"];
