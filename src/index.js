const { RelayServer } = require('./RelayServer.js');
const { RelayNode } = require('./RelayNode.js');
const { RelayBeacon } = require('./RelayBeacon.js');
const randomPort = require('random-port-promise');

/**
 * Relay as a library.
 */
const relay = {
    RelayServer,
    RelayNode,
    RelayBeacon,
    randomPort
};

module.exports = relay;
