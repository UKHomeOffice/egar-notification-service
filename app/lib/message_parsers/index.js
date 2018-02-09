'use strict';
const glob = require('glob');
const path = require('path');
const NotificationMessage = require('./notification-message');

const parsers = [];

class MessageNotHandledError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MessageNotHandledError';
    }
}

class BadParseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BadParseError';
    }
}

module.exports = config => {

    glob.sync(`${__dirname}/*.js`).forEach(file => {
        if (!file.includes('/index.js') && !file.includes('/notification-message.js')) {
            const parserFactory = require(path.resolve(file));
            if (parserFactory instanceof Function) {
                parsers.push(parserFactory(config));
            }
        }
    });

    return {
        /**
         * Iterates across the parsers defined in the message_parsers module
         * to find one that will process the incoming message.
         * @returns {NotificationMessage} The processed message.
         * @throws {MessageNotHandledError} if the message is not handled by any of the processors.
         * @throws {BadParseError} if a processor handles the message,
         *                          but does not return an instance of NotificationMessage
         */
        process: message => {
            let processedMessage = new NotificationMessage();

            // First processor to handle the message wins
            const handled = parsers.some(parser => {
                let parserHandled = false;

                if (parser.handles && parser.process && parser.handles(message)) {
                    processedMessage = parser.process(message);
                    parserHandled = true;
                }

                return parserHandled;
            });

            if (!handled) {
                throw new MessageNotHandledError(`Message not handled: ${JSON.stringify(message)}`);
            }

            if (!processedMessage instanceof NotificationMessage) {
                throw new BadParseError('Processed message was not a NotificationMessage');
            }

            return processedMessage;
        }
    };
};
