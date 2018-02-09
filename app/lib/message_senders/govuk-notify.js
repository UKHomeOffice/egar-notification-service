'use strict';
const minimatch = require('minimatch');
const NotifyClient = require('notifications-node-client').NotifyClient;

module.exports = config => {
    const active = config['active-profiles'].includes('send-notify');
    const name = 'notify';

    let notifyClient;

    if (active && config['send-notify-api-key']) {
        notifyClient = new NotifyClient(config['send-notify-api-key']);
    }

    return {
        name: name,

        /**
         * Checks to see if message recipient is whitelisted for Notify
         * @returns {boolean} true if the recipient is whitelisted, else false.
         */
        willSend: (sendBy, message) => {
            return sendBy === name &&
                active &&
                config['send-notify-whitelist'].some(pattern => {
                    return minimatch(message.to, pattern);
                });
        },

        /**
         * Sends an e-mail to the GOV.UK Notification Service (Notify)
         * @param {NotificationMessage} message The message to send to Notify.
         */
        send: (messageId, notificationMessage) => {
            return notifyClient.sendEmail(notificationMessage.notificationTemplateId, notificationMessage.to, {
                personalisation: notificationMessage.personalisation,
                reference: `Message ${messageId}`
            });
        }
    };
};
