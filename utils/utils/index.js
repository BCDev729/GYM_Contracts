function getNamedAccountsConfig(index, publicKeyAddress) {
    if (typeof (publicKeyAddress) == "undefined") {
        return { default: index }
    }
    return {
        default: index,
        "rinkeby": publicKeyAddress,
        "kovan": publicKeyAddress,
        "ropsten": publicKeyAddress,
        "goerli": publicKeyAddress
    }
}

module.exports = { getNamedAccountsConfig }
