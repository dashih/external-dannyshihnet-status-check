'use strict';

const fs = require('fs');
const path = require('path');
const { WebClient } = require('@slack/web-api');

// Get request against url or custom function.
const apps = [
    { name: 'Bitwarden', url: 'https://bitwarden.dannyshih.net' },
    { name: 'dannycloud', url: 'https://nextcloud.dannyshih.net' },
    { name: 'Danny Gas App', func: async () => {
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
    { name: 'Wordpress', url: 'https://wordpress.dannyshih.net' },
    { name: 'Sort visualizer', url: 'https://sort-visualizer.dannyshih.net' },
    { name: 'Scrabble Helper', func: async () => {
        const response = await fetch('https://scrabble-solver.dannyshih.net/api/getVersions', {
            method: 'POST'
        });
        if (response.ok) {
            await response.json();
        }

        return response;
    }},
    { name: 'Quotes', func: async () => {
        const response = await fetch('https://quotes.dannyshih.net/api/getRandomQuote');
        if (response.ok) {
            await response.text();
        }

        return response;
    }}
];

const slackToken = fs.readFileSync('slack-token.txt', 'utf8');
const slackChannel = '#alerts-and-notifications';
const slackClient = new WebClient(slackToken);

const isDailyStatus = process.env.DAILY !== undefined;

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
            let res = undefined;
            if (app.hasOwnProperty('func')) {
                res = await execWithRetry(app.func);
            } else {
                res = await execWithRetry(async () => {
                    return await fetch(url);
                });
            }

            msg += `:large_green_circle: ${name}\n`;
        } catch (err) {
            allGood = false;
            msg += `:red_circle: ${name} (${err.message})\n`;
        }
    }

    if (isDailyStatus) {
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
