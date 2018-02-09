'use strict';

const AWS = require('aws-sdk');
const Consumer = require('sqs-consumer');
const FAKE_QUEUE_POLL_FREQUENCY = 5 * 1000;

/**
 * Creates a message to send from a queue message
 * @param {*} queueMessage The message that was enqueued
 * @returns {Object} The message + metadata
 */
const createNotificationMessage = queueMessage => {
    return {
        id: queueMessage.MessageId,
        body: JSON.parse(queueMessage.Body),
        sendBy: queueMessage.MessageAttributes.sendBy.StringValue
    };
};

module.exports = config => {
    const log = config.logger;
    let consumer;

    if (config['fake-queue']) {
        consumer = {
            start() {
                setInterval(() => {
                    config.fakeMessageQueue.forEach(m => {
                        const notificationMessage = createNotificationMessage(m);
                        config.messageEvent.emit('queue-message-received', notificationMessage, () => {
                            log.debug(`Processed message ${notificationMessage.id}`);
                        });
                    });

                    config.fakeMessageQueue = [];
                }, FAKE_QUEUE_POLL_FREQUENCY);
            }
        };
    } else {
        AWS.config.update({
            region: config['notification-request-queue-region'],
            accessKeyId: config['notification-request-queue-access-key-id'],
            secretAccessKey: config['notification-request-queue-secret-key']
        });

        consumer = Consumer.create({
            queueUrl: config['notification-request-queue-url'],
            messageAttributeNames: ['sendBy'],
            handleMessage: (message, done) => {
                const notificationMessage = createNotificationMessage(message);
                config.messageEvent.emit('queue-message-received', notificationMessage, done);
            },
            sqs: new AWS.SQS()
        });

        consumer.on('error', err => {
            log.error(err);
        });

        consumer.on('processing_error', err => {
            log.error(err);
        });

        consumer.on('message_received', message => {
            log.info(`Received message ${message.MessageId}`);
            log.silly(message);
        });

        consumer.on('message_processed', message => {
            log.debug(`Processed message ${message.MessageId}`);
            log.silly(message);
        });

        consumer.on('empty', () => {
            log.debug('Message queue empty');
        });
    }

    return consumer;
};
