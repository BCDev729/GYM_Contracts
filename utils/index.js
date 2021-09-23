const { getEOAAccountsPrivateKeys, getEOAAccountsPublicKeys } = require("./accounts");
const { VARIABLES } = require("./constants");
const { getNamedAccountsConfig } = require("./utils");

module.exports = {
    getEOAAccountsPrivateKeys,
    getEOAAccountsPublicKeys,
    VARIABLES,
    getNamedAccountsConfig,
};
