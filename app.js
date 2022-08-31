'use strict';

const fs = require('fs');
const execSync = require('child_process').execSync;
const { Telnet } = require('telnet-client');
const { WebClient } = require('@slack/web-api');

// If a service defines a URL, a GET request is issued.
// Otherwise, a service must define a custom function.
const apps = [
    { name: 'Ping IPv6', func: async () => {
        execSync('ping -6 -w 2 2601:602:a001:2f82::42:42');
        return { ok: true };
    }},
    { name: 'Ping IPv4', func: async () => {
        execSync('ping -4 -w 2 76.104.250.53');
        return { ok: true };
    }},
    { name: 'Nextcloud', url: 'https://nextcloud.dannyshih.net' },
    { name: 'Nextcloud Collabora', url: 'https://collabora.dannyshih.net'},
    { name: 'Bitwarden', url: 'https://bitwarden.dannyshih.net' },
    { name: 'Wordpress', url: 'https://wordpress.dannyshih.net' },
    { name: 'Wordpress Quotes', func: async () => {
        const response = await fetch('https://quotes.dannyshih.net/api/getRandomQuote');
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
    { name: 'Sort visualizer', url: 'https://sort-visualizer.dannyshih.net' },
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

const slackToken = fs.readFileSync(`${__dirname}/slack-token.txt`, 'utf8');
const slackChannel = '#alerts-and-notifications';
const slackClient = new WebClient(slackToken);

const alwaysNotify = process.argv.includes('always-notify');

const maxRetries = 12;
const timeBetweenRetries = 5000; // 5 seconds

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

(async () => {
    let allGood = true;
    let msg = '';
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
        const msgHeader = `${':coffee: '.repeat(4)}\n*Wenatchee Daily*`;
        await slackClient.chat.postMessage({
            channel: slackChannel,
            text: msgHeader,
            attachments: `[{"text": "${msg}"}]`
        });
    } else if (!allGood) {
        const msgHeader = `${':anger: '.repeat(4)}\n*Wenatchee Alarm*`;
        await slackClient.chat.postMessage({
            channel: slackChannel,
            text: msgHeader,
            attachments: `[{"text": "${msg}"}]`
        });
    }
})();
