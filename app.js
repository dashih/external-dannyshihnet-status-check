#!/home/danny/.nvm/versions/node/v18.2.0/bin/node

'use strict';

const fs = require('fs');
const path = require('path');

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
    }}
];

const slackToken = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')))['slackToken'];
const slackAuth = 'Bearer ' + slackToken;
const slackPostMessageUrl = 'https://slack.com/api/chat.postMessage';
const slackChannel = '#alerts-and-notifications';

const isDailyStatus = process.argv.includes('daily');

(async () => {
    let allGood = true;
    let msg = '';
    for (const app of apps) {
        const name = app.name;
        const url = app.url;
        try {
            let res = undefined;
            if (app.hasOwnProperty('func')) {
                res = await app.func();
            } else {
                res = await fetch(url);
            }

            if (res.ok) {
                msg += `:large_green_circle: ${name}\n`;
            } else {
                throw new Error(res.status + ': ' + res.statusText);
            }
        } catch (err) {
            allGood = false;
            msg += `:red_circle: ${name} (${err.message})\n`;
        }
    }

    if (isDailyStatus) {
        const msgHeader = `${':coffee: '.repeat(4)}\n*Wenatchee Daily*`;
        await fetch(slackPostMessageUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: slackAuth
            },
            body: JSON.stringify({
                channel: slackChannel,
                text: msgHeader,
                attachments: `[{"text": "${msg}"}]`
            })
        });
    } else if (!allGood) {
        const msgHeader = `${':anger: '.repeat(4)}\n*Wenatchee Alarm*`;
        await fetch(slackPostMessageUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: slackAuth
            },
            body: JSON.stringify({
                channel: slackChannel,
                text: msgHeader,
                attachments: `[{"text": "${msg}"}]`
            })
        });
    }
})();
