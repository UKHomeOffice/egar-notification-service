'use strict';
const _ = require('lodash');
const glob = require('glob');
const path = require('path');

const senders = [];

module.exports = config => {
    const log = config.logger;

    glob.sync(`${__dirname}/*.js`).forEach(file => {
        if (!file.includes('/index.js')) {
            const senderFactory = require(path.resolve(file));
            if (senderFactory instanceof Function) {
                senders.push(senderFactory(config));
            }
        }
    });

    return {
        send: (message) => {
            const sentBy = {};
            const sendPromises = senders.map(sender => {
                if (sender.willSend &&
                    sender.send &&
                    sender.willSend(message.sendBy, message.body)) {
                    return sender.send(message.id, message.body)
                        .then(() => {
                            sentBy[sender.name] = true;
                        })
                        .catch(err => {
                            log.error(err);
                        });
                }
            });

            return Promise.all(_.filter(sendPromises, p => !!p))
                .then(() => {
                    return sentBy;
                });
        }
    };
};
