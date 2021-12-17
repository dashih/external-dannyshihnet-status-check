#!/usr/bin/node

'use strict';

const axios = require('axios');
const nodemailer = require('nodemailer');
const util = require('util');

const apps = [
    { name: 'Bitwarden', url: 'https://dannyshih.net:8443' },
    { name: 'dannycloud', url: 'https://dannyshih.net/status.php' },
    { name: 'Danny Gas App', url: 'https://dannyshih.net:44300' },
    { name: 'Wordpress', url: 'https://dannyshih.net:44301' }
];

const mailer = nodemailer.createTransport({
    host: '192.168.42.8',
    port: 25,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

var msg = '';
(async () => {
    for (let i = 0; i < apps.length; i++) {
        const name = apps[i].name;
        const url = apps[i].url;
        let status = undefined;
        try {
            const res = await axios.get(url);
            status = res.status;
        } catch (err) {
        }

        msg += util.format('%s %s\n',
            status === 200 ? ':large_green_circle:' : ':red_circle:',
            name);
    }

    await mailer.sendMail({
        from: 'gentoo-linux@dannyshih.net',
        to: 'gentoo-linux@dannyshih.net',
        subject: 'Daily Status',
        text: msg
    });
})();
