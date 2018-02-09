'use strict';

const SMTPServer = require('smtp-server').SMTPServer;
const simpleMailParser = require('mailparser').simpleParser;

module.exports = config => {
    const log = config.logger;
    const active = config['active-profiles'].includes('listen-smtp');

    const smtpServer = new SMTPServer({
        // Advertise allowing a maximum message size
        size: config['max-incoming-message-size'],
        onConnect(session, callback) {
            log.debug(`Connection from ${session.remoteAddress}`);

            // Accept all connections, iptable/firewall rules and/or an auth proxy should be
            // put in place to restrict access to the service
            return callback();
        },
        onData(stream, session, callback) {
            simpleMailParser(stream)
                .then(mail => {
                    config.messageEvent.emit('incoming-message-received', mail, err => {
                        callback(err);
                    });
                });
        },
        authOptional: true
    });

    smtpServer.on('error', err => {
        log.error(err);
    });

    return {
        /**
         * If listen-smtp active, starts listening for SMTP messages on the configured 'listen-smtp-port'
         */
        start: () => {
            if (!active) {
                return;
            }

            const smtpPort = config['listen-smtp-port'];
            smtpServer.listen(smtpPort, null, err => {
                if (err) {
                    log.error(err);
                    return;
                }
                log.info(`Listening for SMTP connections on port ${smtpPort}`);
            });
        }
    };
};
