'use strict';

const fs = require('fs');
const dns = require('dns');
const util = require('util');
const { Telnet } = require('telnet-client');
const { WebClient } = require('@slack/web-api');

const lookup = util.promisify(dns.lookup);
const resolve4 = util.promisify(dns.resolve4);
const resolve6 = util.promisify(dns.resolve6);

// If a service defines a URL, a GET request is issued.
// Otherwise, a service must define a custom function.
const apps = [
    { name: 'Nextcloud', url: 'http://nextcloud.dannyshih.net' },
    { name: 'Nextcloud Collabora', url: 'http://collabora.dannyshih.net'},
    { name: 'Bitwarden', url: 'http://bitwarden.dannyshih.net' },
    { name: 'Wordpress', url: 'http://wordpress.dannyshih.net' },
    { name: 'Fred\'s Wordpress', url: 'http://fred.dannyshih.net' },
    { name: 'Wordpress Quotes', func: async () => {
        const response = await fetch('http://quotes.dannyshih.net/api/getRandomQuote');
        if (response.ok) {
            await response.text();
        }

        return response;
    }},
    { name: 'Teamspeak', func: async () => {
        const connection = new Telnet();
        const params = {
            host: 'teamspeak.dannyshih.net',
            port: 10011,
            negotiationMandatory: false,
            timeout: 3000
        }

        await connection.connect(params);
        await connection.end();
        return { ok: true };
    }},
    { name: 'Gas', func: async () => {
        const response = await fetch('https://gas.dannyshih.net/api/getCarData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ car: '2018-Ford-Mustang-GT350' })
        });

        if (response.ok) {
            // Additionally retrieve the json, in case that produces an error.
            await response.json();
        }

        return response;
    }},
    { name: 'Sort visualizer', url: 'http://sort-visualizer.dannyshih.net' },
    { name: 'Scrabble Helper', func: async () => {
        const response = await fetch('https://scrabble-solver.dannyshih.net/api/getVersions', {
            method: 'POST'
        });
        if (response.ok) {
            await response.json();
        }

        return response;
    }}
];

const slackChannel = '#alerts-and-notifications';

const maxRetries = 2;
const timeBetweenRetries = 100; // 100 ms

async function execWithRetry(func) {
    let result = undefined;
    let error = undefined;
    for (let i = 0; i < maxRetries; i++) {
        try {
            result = await func();
            if (result.ok) {
                error = undefined;
                break;
            } else {
                throw new Error('non-OK status');
            }
        } catch (err) {
            error = err;
            console.warn(`retrying on error: ${error}`);
        }

        await new Promise(r => setTimeout(r, timeBetweenRetries));
    }

    if (error !== undefined) {
        throw error;
    }

    return result;
}

exports.handler = async (event) => {
    const alwaysNotify = event.alwaysNotify;
    const slackToken = fs.readFileSync(`${__dirname}/slack-token.txt`, 'utf8');
    const slackClient = new WebClient(slackToken);

    // Lookup/resolve IPv6 and IPv4
    const lookupAddr = await lookup('bitwarden.dannyshih.net');
    const resolve6Addr = await resolve6('bitwarden.dannyshih.net');

    let allGood = true;
    let msg = `${lookupAddr.address} (Fetch target)\n${resolve6Addr}\n\n`;
    for (const app of apps) {
        const name = app.name;
        const url = app.url;
        try {
            if (app.hasOwnProperty('func')) {
                await execWithRetry(app.func);
            } else {
                await execWithRetry(async () => {
                    return await fetch(url);
                });
            }

            msg += `:large_green_circle: ${name}\n`;
        } catch (err) {
            allGood = false;
            msg += `:red_circle: ${name} (${err.message})\n`;
        }
    }

    if (alwaysNotify) {
        const msgHeader = `${':coffee: '.repeat(4)}\n*AWS Lambda Daily*`;
        await slackClient.chat.postMessage({
            channel: slackChannel,
            text: msgHeader,
            attachments: `[{"text": "${msg}"}]`
        });
    } else if (!allGood) {
        const msgHeader = `${':anger: '.repeat(4)}\n*AWS Lambda Alarm*`;
        await slackClient.chat.postMessage({
            channel: slackChannel,
            text: msgHeader,
            attachments: `[{"text": "${msg}"}]`
        });
    }
};
