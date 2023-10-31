const HyperDHT = require('hyperdht');
const net = require('net');
const nullstream = require('nullstream');
const libNet = require('@hyper-cmd/lib-net');
const libUtils = require('@hyper-cmd/lib-utils');
const libKeys = require('@hyper-cmd/lib-keys');

const { RelayNode } = require('./RelayNode.js');
const { ScarZebraAccount } = require('./auth/ScarZebraAccount.js');
const { getAccountFilePath } = require('./auth/directories.js');

const connPiper = libNet.connPiper;

function prepareConfig(config, opts) {
    if (opts.serverPublicKey) {
        config.serverPublicKey =
            libUtils.resolveHostToKey(
                [],
                opts.serverPublicKey
            );
    }

    if (opts.configFilePath) {
        libUtils.readConf(
            config,
            opts.configFilePath
        );
    }

    if (!config.keepAlive) {
        config.keepAlive = 5000;
    }

    if (
        (typeof opts.compress === 'boolean' && opts.compress === true) ||
        (typeof opts.compress === 'number' && opts.compress != 0)
    ) {
        config.compress = true;
    }
}

class RelayServer extends RelayNode {
    constructor(opts, cb=null) {
        super();

        if (!opts.unixSocket && !+opts.port) {
            throw "Invalid proxy port.";
        }

        if (opts.unixSocket && opts.port) {
            throw "Cannot simultaneously listen to both a port and Unix domain socket.";
        }

        const config = this._config = {};

        this._port =
            opts.unixSocket ?
            opts.unixSocket :
            +opts.port;

        opts.peer = opts.serverPublicKey;

        prepareConfig(config, opts);

        const serverPublicKey = config.serverPublicKey;

        if (!serverPublicKey) {
            throw "Invalid server key.";
        }

        this._isDebugModeEnabled = opts.debug;

        let account = null;

        if (opts.accountFilePath) {
            account =
                libUtils.resolveAccount(
                    [],
                    opts.accountFilePath
                );

            if (!account) {
                throw "Invalid account file.";
            }

            account = libKeys.parseKeyPair(account);

            account = ScarZebraAccount.fromJSON(account);
        }

        this._account = account;

        this._stats = {};

        this._dht = new HyperDHT(
            {
                keyPair: account
            }
        );

        this._createProxy();

        this._isRunning = true;

        this._listen(cb);

        this._registerAllListeners();
    }

    static createSync(port, serverPublicKey, username=null, opts={}, cb=null) {
        if (typeof opts !== 'object' || opts === null) {
            opts = {};
        }

        if (typeof port !== 'number') {
            throw `Invalid port number \`${port}\``;
        }

        if (typeof serverPublicKey !== 'string') {
            throw `Invalid server public key "${serverPublicKey}"`;
        }

        if (typeof username !== 'string' && username !== null) {
            username = null;
        }

        opts.port = port;
        opts.serverPublicKey = serverPublicKey;

        if (typeof username === 'string') {
            opts.accountFilePath = getAccountFilePath(username);
        }

        return new RelayServer(opts, cb);
    }

    async destroy() {
        await this.disconnect();
    }

    async disconnect() {
        if (this._isRunning === false) {
            return;
        }

        this._isRunning = false;

        await this._dht.destroy();
    }

    getPublicKey() {
        return this._config.serverPublicKey;
    }

    setPublicKey() {
        return this._config.serverPublicKey;
    }

    _createProxy() {
        const config = this._config;

        this._proxy = net.createServer(
            {
                allowHalfOpen: true
            },
            c => {
                return connPiper(
                    c,
                    () => {
                        if (this._dht.destroyed) {
                            if (!c.destroyed) {
                                c.destroy();
                            }

                            return nullstream.createWriteStream();
                        }

                        const stream = this._dht.connect(
                            Buffer.from(
                                config.serverPublicKey,
                                'hex'
                            ),
                            {
                                reusableSocket: true
                            }
                        );

                        stream.setKeepAlive(config.keepAlive);

                        return stream;
                    },
                    {
                        compress: config.compress
                    },
                    this._stats
                );
            }
        );
    }

    _listen(cb) {
        this._proxy.listen(
            this._port,
            () => {
                if (typeof cb === 'function') {
                    cb(
                        {
                            port: this._port,
                            client: this
                        }
                    );
                }
            }
        );
    }

    _registerDebugLog() {
        if (this._isDebugModeEnabled) {
            setInterval(
                () => {
                    console.debug(
                        'connection stats',
                        this._stats
                    );
                },
                5000
            );
        }
    }

    _registerAllListeners() {
        this._registerExitListener();
        this._registerDebugLog();
    }

    _registerExitListener() {
        process.once(
            'SIGINT',
            async () => {
                await this.disconnect();
            }
        );
    }
}

module.exports = { RelayServer };
