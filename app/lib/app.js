'use strict';

module.exports = config => {
    const log = config.logger;

    // Provide an event emitter as config to allow loose coupling between modules
    const EventEmitter = require('events');
    class MessageEvent extends EventEmitter {}
    const messageEvent = new MessageEvent();
    config.messageEvent = messageEvent;

    return {
        start() {
            if (config['active-profiles'].includes('producer')) {
                const messageListeners = require('./message_listeners')(config);
                const messageParsers = require('./message_parsers')(config);
                const queueProducer = require('./queue-producer')(config);

                messageEvent.on('incoming-message-received', (message, callback) => {
                    let error;
                    try {
                        const processedMessage = messageParsers.process(message);
                        queueProducer.enqueue(processedMessage);
                    } catch (err) {
                        error = err;
                        log.error(err);
                    }

                    callback(error);
                });

                messageListeners.start();
            }

            if (config['active-profiles'].includes('consumer')) {
                const messageSenders = require('./message_senders')(config);
                const queueConsumer = require('./queue-consumer')(config);
                const distLock = require('./dist-lock')(config);

                class RequiredSendError extends Error {
                    constructor(message) {
                        super(message);
                        this.name = 'RequiredSendError';
                    }
                }

                messageEvent.on('queue-message-received', (message, callback) => {
                    let lock;
                    return distLock.getLock(message)
                        .then(l => {
                            lock = l;
                            log.debug(`Obtained lock: ${lock.value}`);
                            return messageSenders.send(message);
                        })
                        .then(sentBy => {
                            if (message.sendBy === 'any' || sentBy[message.sendBy]) {
                                log.info(`Outgoing message ${message.id} sent successfully`);
                                callback();
                            } else {
                                log.warn(`Outgoing message ${message.id} ` +
                                    `was not sent by its required sender ${message.sendBy}`);
                                callback(new RequiredSendError(`${message.id}`));
                            }

                            distLock.releaseLock(lock);
                        })
                        .catch(err => {
                            log.error(`Outgoing message ${message.id} not sent successfully: ${err}`);
                            callback(new Error(`${message.id}`));

                            distLock.releaseLock(lock);
                        });
                });

                queueConsumer.start();
            }
        }
    };
};
