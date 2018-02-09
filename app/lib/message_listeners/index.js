'use strict';
const glob = require('glob');
const path = require('path');

const listeners = [];

module.exports = config => {
    glob.sync(`${__dirname}/*.js`).forEach(file => {
        if (!file.includes('/index.js')) {
            const listenerFactory = require(path.resolve(file));
            if (listenerFactory instanceof Function) {
                listeners.push(listenerFactory(config));
            }
        }
    });

    return {
        start: () => {
            listeners.forEach(l => l.start());
        }
    };
};
