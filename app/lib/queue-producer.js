'use strict';

const Producer = require('sqs-producer');
const uuid = require('uuid').v4;

/**
 * Creates a queue message
 * @param {NotificationMessage} message The incoming message to enqueue
 * @param {string} sendBy The string that identifies the required sender
 * @returns {Object} The queue request message
 */
const createQueueMessage = (message, sendBy) => {
    return {
        id: uuid(),
        body: JSON.stringify(message),
        messageAttributes: {
            sendBy: { DataType: 'String', StringValue: sendBy }
        }
    };
};

module.exports = config => {
    const log = config.logger;

    let producer;

    if (config['fake-queue']) {
        producer = {
            enqueue: message => {
                let requireSentBy = config['require-sent-by'];
                if (!Array.isArray(requireSentBy)) {
                    requireSentBy = [requireSentBy];
                }

                requireSentBy.map(r => {
                    const queueMessage = createQueueMessage(message, r);
                    config.fakeMessageQueue.push({
                        MessageId: queueMessage.id,
                        Body: queueMessage.body,
                        MessageAttributes: queueMessage.messageAttributes
                    });
                });
            }
        };
    } else {
        const sqsProducer = Producer.create({
            queueUrl: config['notification-request-queue-url'],
            region: config['notification-request-queue-region'],
            accessKeyId: config['notification-request-queue-access-key-id'],
            secretAccessKey: config['notification-request-queue-secret-key']
        });

        producer = {
            enqueue: message => {
                let requireSentBy = config['require-sent-by'];
                if (!Array.isArray(requireSentBy)) {
                    requireSentBy = [requireSentBy];
                }

                const enqueuePromises = requireSentBy.map(r => {
                    return new Promise((resolve, reject) => {
                        sqsProducer.send(createQueueMessage(message, r), err => {
                            if (err) {
                                log.error(err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                });

                return Promise.all(enqueuePromises);
            }
        };
    }

    return producer;
};
