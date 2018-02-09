'use strict';
const _ = require('lodash');
const minimatch = require('minimatch');
const NotificationMessage = require('./notification-message');

const GENERIC_TEMPLATE_ID = '02c61e5e-bc97-4545-8ef3-4212292bc5f0';
const TYPE = 'Generic Email';

module.exports = config => {
    const log = config.logger;

    return {
        /**
         * Checks a received message to see if this processor knows how to handle it
         * @param {Object} message The message as received from from a message receiver
         * @returns {Boolean} true if this processor can handle it, else false
         */
        handles: message => {
            const sender = _.at(message, 'from.text')[0];

            const handlesMessage = message && sender && config['receive-email-whitelist'].some(pattern => {
                return minimatch(sender, pattern);
            });

            if (handlesMessage) {
                log.info('Handling e-mail message');
            }

            return handlesMessage;
        },

        /**
         * Processes a message to convert it in to a standard Notify format
         * @param {Object} message The message as received from from a message receiver
         * @returns {NotificationMessage} The processed message to send via the Notification Service
         */
        process(message) {
            const personalisation = {
                subject: message.subject,
                body: message.text
            };

            const notificationMessage
                = new NotificationMessage({
                    notificationTemplateId: GENERIC_TEMPLATE_ID,
                    type: TYPE,
                    to: message.to.text,
                    personalisation,
                    subject: message.subject,
                    text: message.text,
                    html: message.html
                });

            return notificationMessage;
        }
    };
};
