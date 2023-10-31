const { randomBytes } = require('crypto');
const { mkdirSync, readFileSync } = require('fs');
const { mkdir, readFile, rm, writeFile } = require('fs/promises');
const { homedir } = require('os');
const { getAccountFilePath } = require('./directories.js');

class ScarZebraAccount {
    constructor(opts) {
        if (typeof opts !== 'object') {
            opts = {};
        }

        this._publicKey =
            typeof opts.publicKey === 'object' &&
                opts.publicKey instanceof Buffer ?
            opts.publicKey :
            randomBytes(32);

        this._privateKey =
            typeof opts.privateKey === 'object' &&
                opts.privateKey instanceof Buffer ?
            opts.privateKey :
            randomBytes(64);
    }

    privateKey() {
        return this._privateKey;
    }

    publicKey() {
        return this._publicKey;
    }

    async save(username, password) {
        // TODO: Hash the password.
        // TODO: Use the password hash to encrypt the data.
        // Determine the path of the account JSON file.
        const accountFilePath = getAccountFilePath(username);

        await mkdir(
            identitiesdir(),
            {
                recursive: true
            }
        );

        await this.writeFile(accountFilePath);
    }

    saveSync(username, password) {
        // TODO: Hash the password.
        // TODO: Use the password hash to encrypt the data.
        // Determine the path of the account JSON file.
        const accountFilePath = getAccountFilePath(username);

            mkdirSync(
                identitiesdir(),
                {
                    recursive: true
                }
            );

        this.writeFileSync(accountFilePath);
    }

    stringify() {
        return ScarZebraAccount.stringify(this);
    }

    toJSON() {
        return {
            secretKey: this._privateKey.toString('hex'),
            publicKey: this._publicKey.toString('hex')
        };
    }

    async writeFile(path, cryptoKey='', algorithm='utf8') {
        // TODO: Add a switch statement to handle algorithms and encodings.
        const jsonString = this.stringify();

        await writeFile(path, jsonString, 'utf8');

        return ScarZebraAccount.parse(jsonString);
    }

    writeFileSync(path, cryptoKey='', algorithm='utf8') {
        // TODO: Add a switch statement to handle algorithms and encodings.
        const jsonString = this.stringify();

        writeFileSync(path, jsonString, 'utf8');

        return ScarZebraAccount.parse(jsonString);
    }

    static async create() {
        let privateKey = null;
        let publicKey = null;

        randomBytes(
            64,
            (error, buffer) => {
                if (error) throw error;

                privateKey = buffer.toString('hex');
            }
        );

        randomBytes(
            32,
            (error, buffer) => {
                if (error) throw error;

                publicKey = buffer.toString('hex');
            }
        );

        const accountJSON = {
            privateKey,
            publicKey
        };

        return ScarZebraAccount.fromJSON(accountJSON);
    }

    static createSync() {
        return new ScarZebraAccount();
    }

    static async delete(username='default') {
        // Determine the path of the account JSON file.
        const accountFilePath = getAccountFilePath(username);

        return await rm(accountFilePath);
    }

    static fromJSON(json) {
        let privateKey = null;
        let publicKey = null;

        // Private key
        if (json.hasOwnProperty('secretKey')) {
            privateKey =
                Buffer.from(
                    json.secretKey,
                    'hex'
                );
        }
        else if (json.hasOwnProperty('privateKey')) {
            privateKey =
                Buffer.from(
                    json.privateKey,
                    'hex'
                );
        }

        // Public key
        if (json.hasOwnProperty('publicKey')) {
            publicKey =
                Buffer.from(
                    json.publicKey,
                    'hex'
                );
        }

        return new ScarZebraAccount(
            {
                privateKey,
                publicKey
            }
        );
    }

    static parse(jsonString) {
        const json = JSON.parse(jsonString);

        return ScarZebraAccount.fromJSON(json);
    }

    static async readFile(path, cryptoKey='', algorithm='utf8') {
        // TODO: Add a switch statement to handle algorithms and encodings.
        const jsonString =
            await readFile(
                path,
                'utf8'
            );

        return ScarZebraAccount.parse(jsonString);
    }

    static readFileSync(path, cryptoKey='', algorithm='utf8') {
        // TODO: Add a switch statement to handle algorithms and encodings.
        const jsonString =
            readFileSync(
                path,
                'utf8'
            );

        return ScarZebraAccount.parse(jsonString);
    }

    static async load(username, password) {
        // Determine the path of the account JSON file.
        const accountFilePath = getAccountFilePath(username);

        return await ScarZebraAccount.readFile(
            accountFilePath,
            'utf8'
        );
    }

    static loadSync(username, password) {
        // Determine the path of the account JSON file.
        const accountFilePath = getAccountFilePath(username);

        return ScarZebraAccount.readFileSync(
            accountFilePath,
            'utf8'
        );
    }

    static stringify(account) {
        const json = account.toJSON();

        return JSON.stringify(json);
    }
}

module.exports = {
    ScarZebraAccount
};
