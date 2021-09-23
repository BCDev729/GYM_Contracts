const accounts = {
    deployer: {
        publicKey: "0x5f2cFa351B7d4b973d341fdB2cB154794c0a899c",
        privateKey: "0x43e2458f1c385b0a7c1186c0693a16c63ea148bd8b97982373cd5138fa605a73",
    },
    owner: {
        publicKey: "0x834c78b59638ae4114cA939966e675A87a60fA7D",
        privateKey: "0x5937868f836027519da388a4517a2fa8eb169bb845287ee3b02f82cf49891641",
    },
    caller: {
        publicKey: "0xf97eb12012FEA5785B728BB4951f1fAfF50408F6",
        privateKey: "0x9401c0a96ba99f771d6441c28aab2327cf1d3430c23b7cbf3a961ab26b577518",
    },
    holder: {
        publicKey: "0x1bC4765e9715465572C4A14c9e7e91EFBb46e681",
        privateKey: "0xad9a34a575972bcb6161f0d99953bd60fbc93c3fcb13a88e361333d8daee9eec",
    },
    vzgo: {
        publicKey: "0x7bb88F894eD953afaBf2Da96B5301e06B61fe172",
        privateKey: "0xdbbc71da788f62510ac091f87d10d2a9d342fd146ac96dd21102934210ccd6a6",
    },
    grno: {
        publicKey: "0xb5046547E18c91266dBaCA3d92D707fc656d8dAe",
        privateKey: "0xd583682d1ea4085ffc1a8908a525017d2d230e4ddef1354ad52abf64f52743b1",
    },
};

function getEOAAccountsPrivateKeys() {
    let eoaAccountsPrivateKeys = [];

    for (let name in accounts) {
        eoaAccountsPrivateKeys.push(accounts[name].privateKey);
    }

    return eoaAccountsPrivateKeys;
}

function getEOAAccountsPublicKeys() {
    let eoaAccountsPublicKeys = [];

    for (let name in accounts) {
        eoaAccountsPublicKeys.push(accounts[name].publicKey);
    }

    return eoaAccountsPublicKeys;
}

module.exports = { getEOAAccountsPrivateKeys, getEOAAccountsPublicKeys };