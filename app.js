#!/home/danny/.nvm/versions/node/v18.2.0/bin/node

'use strict';

const util = require('util');
const fs = require('fs');
const path = require('path');

// Get request against url or custom function.
const apps = [
    { name: 'Bitwarden', url: 'https://dannyshih.net:8443' },
    { name: 'dannycloud', url: 'https://dannyshih.net' },
    { name: 'Danny Gas App', func: async () => {
        const response = await fetch('https://dannyshih.net:44300/api/getCarData', {
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
    { name: 'Wordpress', url: 'https://dannyshih.net:44301' },
    { name: 'Sort visualizer', url: 'https://dannyshih.net:44302' },
    { name: 'Scrabble Helper', func: async () => {
        const response = await fetch('https://dannyshih.net:44303/api/getVersions', {
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
                msg += util.format('%s %s\n', ':large_green_circle:', name);
            } else {
                throw new Error(res.status + ': ' + res.statusText);
            }
        } catch (err) {
            allGood = false;
            msg += util.format('%s %s (%s)\n', ':red_circle:', name, err.message);
        }
    }

    if (isDailyStatus) {
        const msgHeader = util.format('%s\n*%s*', ':coffee: '.repeat(4), 'Wenatchee Daily');
        await fetch(slackPostMessageUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: slackAuth
            },
            body: JSON.stringify({
                channel: slackChannel,
                text: msgHeader,
                attachments: util.format('[{"text": "%s"}]', msg)
            })
        });
    } else if (!allGood) {
        const msgHeader = util.format('%s\n*%s*', ':anger: '.repeat(4), 'Wenatchee Alarm!');
        await fetch(slackPostMessageUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: slackAuth
            },
            body: JSON.stringify({
                channel: slackChannel,
                text: msgHeader,
                attachments: util.format('[{"text": "%s"}]', msg)
            })
        });
    }
})();
