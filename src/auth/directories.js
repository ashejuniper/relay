const { homedir } = require("os");

function identitiesdir() {
    return `${homedir()}/.portal-net/accounts`;
}

function getAccountFilePath(username) {
    return `${identitiesdir()}/${username}.json`;
}

module.exports = {
    identitiesdir,
    getAccountFilePath
};
