#!/usr/bin/env node

const { readFileSync } = require("fs");

const { randomBytes } = require('crypto');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const minimist = require('minimist');
const { randomPort, RelayServer, RelayBeacon } = require("../src/index.js");
const { EXIT_CODE_SUCCESS, EXIT_CODE_INVALID_SUBCOMMAND, EXIT_CODE_INVALID_SUBCOMMAND_ACTION, EXIT_CODE_GENERIC } = require("../src/index.js");
const { ScarZebraAccount } = require('../src/auth/ScarZebraAccount.js');

const packageJSONString =
    readFileSync(
        "package.json",
        "utf-8"
    );

const packageJSON =
    JSON.parse(packageJSONString);

const PACKAGE_NAME = packageJSON.name;
const PACKAGE_APP_NAME = PACKAGE_NAME.split('/')[1];
const PACKAGE_VERSION = packageJSON.version;

function logHelp(pageNumber) {
    throw "Not yet implemented.";
}

function logUsage() {
    console.log('usage:');
    console.log(`${PACKAGE_APP_NAME} <subcommand> [options]`);
    console.log(`Please see \`${PACKAGE_APP_NAME} --help\` for more info.`);
}

function logVersion() {
    console.log(`${PACKAGE_APP_NAME} v${PACKAGE_VERSION} - $;{PACKAGE_AUTHOR} (c) 2023 All rights reserved.`);
}

async function actionAccountGet(args) {
    let username = 'default';
    let password = "";

    if (typeof args.username !== 'undefined') {
        username = args.username;
    }

    if (typeof args.password !== 'undefined') {
        password = args.password;
    }

    const account =
        await ScarZebraAccount.load(
            username,
            password
        );

    const res = {};

    res.publicKey = account.publicKey().toString('hex');

    // console.log(JSON.stringify(res));
    console.log(res);
}

async function actionAccountReset(args) {
    let username = 'default';

    if (typeof args.username !== 'undefined') {
        username = args.username;
    }

    const account =
        ScarZebraAccount.createSync();

    await account.save(username);
}

async function actionPortHost(args) {
    const serverPublicKey = args._[1];
    const serverPort =
        typeof args.p === 'number' ?
        args.p :
        null;

    if (typeof serverPort !== 'number') {
        throw `Invalid port number '${serverPort}'`;
    }

    const seed =
        typeof args.s === 'string' ?
        args.s :
        randomBytes(32).toString('hex');

    const options = {
        seed,
        port: serverPort
    };

    if (typeof args.compress === 'boolean') {
        options.compress = args.compress;
    }
    else if (typeof args.C === 'boolean') {
        options.compress = args.C;
    }

    if (options.compress) {
        console.log("Compression enabled.");
    }

    const server = new RelayBeacon(
        options,
        (e) => {
            const res = {};

            res.publicKey = e.account.publicKey().toString('hex');

            // console.log(JSON.stringify(res));
            console.log(res);
        }
    );
}

async function actionPortJoin(args) {
    const response = {};

    const serverPublicKey = args._[1];
    const localPort =
        typeof args.p === 'number' ?
        args.p :
        await randomPort();

    const options = {
        serverPublicKey,
        port: localPort
    };

    if (typeof args.compress === 'boolean') {
        options.compress = args.compress;
    }
    else if (typeof args.C === 'boolean') {
        options.compress = args.C;
    }

    if (options.compress) {
        response.compress = true;
    }

    const client = new RelayServer(
        options,
        (e) => {
            response.port = e.port;
            response.publicKey = e.client.getPublicKey();

            // console.log(JSON.stringify(e));
            console.log(response);
        }
    );
}

async function subcmdHelp(args) {
    const page =
                args._[1] ?
                args._[1] :
                (
                    args.p ?
                    args.p :
                    (
                        args.page ?
                        args.page :
                        1
                    )
                );

                // If the provided page number is invalid, exit.
                if (typeof page !== 'number') {
                    console.error(`Invalid page number '${page}'.`);
                    process.exit(EXIT_CODE_GENERIC);
                }

                // Log the requested help page and exit.
                logHelp(page);
}

async function subcmdAccount(args) {
    if (args._.length < 2) {
        throw "Subcommand missing arguments.";
    }

    const subcommandAction = args._[1];

    switch (subcommandAction) {
        case 'get':
            {
                await actionAccountGet(args);

                process.exit(EXIT_CODE_SUCCESS);
            }
        case 'reset':
            {
                console.log('resetting account...');
                await actionAccountReset(args);
                console.log('account reset.');

                process.exit(EXIT_CODE_SUCCESS);
            }
        default:
            {
                console.error(`'${subcommandAction}' is not a valid action for subcommand 'account'.`);
                process.exit(EXIT_CODE_INVALID_SUBCOMMAND_ACTION);
            }
    }
}

async function subcmdPort(args) {
    if (args._.length < 2) {
        throw "Subcommand missing arguments.";
    }

    const subcommandAction = args._[1];

    switch (subcommandAction) {
        case 'host':
            {
                await actionPortHost(args);

                break;
            }
        case 'join':
            {
                await actionPortJoin(args);

                break;
            }
        default:
            {
                console.error(`'${subcommandAction}' is not a valid action for subcommand 'port'.`);
                process.exit(EXIT_CODE_INVALID_SUBCOMMAND_ACTION);
            }
    }
}

async function subcmdUpdate(args) {
    let output = {};
    let result = false;

    let subcommandArgs = [
        "install",
        "-g"
    ];

    // Specify prerelease version.
    if (
        args.alpha
    ) {
        subcommandArgs.push("portalnet@alpha");
    }
    else if (
        args.beta
    ) {
        subcommandArgs.push("portalnet@beta");
    }
    else if (
        args.rc
    ) {
        subcommandArgs.push("portalnet@rc");
    }
    else {
        subcommandArgs.push("portalnet");
    }

    const subcommand =
        subcommandArgs.join(' ');

    // console.log(subcommand);

    // Try pnpm
    try {
        console.log(`pnpm ${subcommand}`)
        output = await exec(
            `pnpm ${subcommand}`
        );

        result = true;
    }
    // Fallback to npm
    catch {
        try {
            output = await exec(
                `npm ${subcommand}`
            );

            result = true;
        }
        // If an error occured, return `false`.
        catch {
            result = false;
        }
    }

    if (result === false) {
        console.error("Invalid update command.");
    }

    // Log stderr if provided.
    if (
        typeof output.stderr === "string" &&
        output.stderr.length > 0
    ) {
        console.log(output.stderr);
    }
    // Log stdout if provided.
    else if (
        typeof output.stdout === "string" &&
        output.stdout.length > 0
    ) {
        console.log(output.stdout);
    }

    return result;
}

function parseCLIArgs() {
    return minimist(
        process.argv.splice(2)
    );
}

async function executeSubcommand(argv) {
    const subcommand = argv._[0];

    switch (subcommand) {
        case '?':
        case 'h':
        case 'help':
            {
                await subcmdHelp(argv);
                process.exit(EXIT_CODE_SUCCESS);
            }
        case 'u':
        case 'usage':
            {
                // Log the command usage and exit.
                logUsage();
                process.exit(EXIT_CODE_SUCCESS);
            }
        case 'v':
        case 'version':
            {
                // Log the command usage and exit.
                logVersion();
                process.exit(EXIT_CODE_SUCCESS);
            }
        case 'p':
        case 'port':
            {
                await subcmdPort(argv);
                // process.exit(EXIT_CODE_SUCCESS);
                break;
            }
        case 'B':
        case 'beacon':
            {
                await actionPortHost(argv);
                // process.exit(EXIT_CODE_SUCCESS);
                break;
            }
        case 'S':
        case 'server':
            {
                await actionPortJoin(argv);
                // process.exit(EXIT_CODE_SUCCESS);
                break;
            }
        case 'i':
        case 'account':
            {
                await subcmdAccount(argv);
                process.exit(EXIT_CODE_SUCCESS);
            }
        case 'update':
            {
                await subcmdUpdate(argv);
                process.exit(EXIT_CODE_SUCCESS);
            }
        default:
            {
                // Log the command usage and exit with an error code.
                logUsage();
                process.exit(EXIT_CODE_INVALID_SUBCOMMAND);
            }
    }
}

// Parse command-line arguments.
const args = parseCLIArgs();

const shouldWriteVersion = args.v || args.version;

if (shouldWriteVersion) {
    // Log the command usage and exit.
    logVersion();
    process.exit(EXIT_CODE_SUCCESS);
}

(
    async () => {
        await executeSubcommand(args);
    }
)();
