#!/usr/bin/node

'use strict';

const axios = require('axios');
const util = require('util');

const apps = [
    { name: 'Bitwarden', url: 'https://dannyshih.net:8443' },
    { name: 'dannycloud', url: 'https://dannyshih.net' },
    { name: 'Danny Gas App', url: 'https://dannyshih.net:44300' },
    { name: 'Wordpress', url: 'https://dannyshih.net:44301' },
    { name: 'Sort visualizer', url: 'https://dannyshih.net:44302' },
    { name: 'Danny Quotes', url: 'https://dannyshih.net:44303' }
];

(async () => {
    apps.forEach(async app => {
        const name = app.name;
        const url = app.url;
        let status = undefined;
        try {
            const res = await axios.get(url);
            status = res.status;
        } catch (err) {
        }

        if (status === 200) {
            console.log(util.format('%s %s', ':large_green_circle:', name));
        } else {
            console.error(util.format('%s %s', ':red_circle:', name));
        }
    });
})();
