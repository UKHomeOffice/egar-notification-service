'use strict';

const express = require('express');
const bodyParser = require('body-parser');

module.exports = config => {
    const log = config.logger;
    const restServer = express();
    const active = config['active-profiles'].includes('listen-rest');

    // Parse application/json requests
    const jsonParser = bodyParser.json();

    restServer.post('/api/V1/mail', jsonParser, (req, res) => {
        if (!req.body) {
            // TO-DO: Do more validation of the incoming JSON to detect bad requests
            return res.sendStatus(400);
        }

        config.messageEvent.emit('incoming-message-received', req.body, err => {
            if (err) {
                log.error(err);
                res.sendStatus(500);
            } else {
                res.sendStatus(201);
            }
        });
    });


    return {
        /**
         * If listen-rest active, starts listening for REST messages on the configured 'listen-api-port'
         */
        start: () => {
            if (!active) {
                return;
            }

            const apiPort = config['listen-api-port'];
            restServer.listen(apiPort, err => {
                if (err) {
                    log.error(err);
                    return;
                }
                log.info(`Listening for REST API connections on port ${apiPort}`);
            });
        }
    };
};
