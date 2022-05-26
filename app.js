#!/home/danny/.nvm/versions/node/v18.2.0/bin/node

'use strict';

const util = require('util');
const fs = require('fs');
const path = require('path');

const apps = [
    { name: 'Bitwarden', url: 'https://dannyshih.net:8443' },
    { name: 'dannycloud', url: 'https://dannyshih.net' },
    { name: 'Danny Gas App', url: 'https://dannyshih.net:44300' },
    { name: 'Wordpress', url: 'https://dannyshih.net:44301' },
    { name: 'Sort visualizer', url: 'https://dannyshih.net:44302' },
    { name: 'Danny Quotes', url: 'https://dannyshih.net:44303' },
    { name: 'Scrabble Helper', url: 'https://dannyshih.net:44304' }
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
            const res = await fetch(url);
            if (res.ok) {
                msg += util.format('%s %s\n', ':large_green_circle:', name);
            } else {
                throw res.status + ': ' + res.statusText;
            }
        } catch (err) {
            allGood = false;
            msg += util.format('%s %s\n', ':red_circle:', name);
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
