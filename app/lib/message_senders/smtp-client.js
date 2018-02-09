'use strict';
const minimatch = require('minimatch');
const nodemailer = require('nodemailer');

module.exports = config => {
    const active = config['active-profiles'].includes('send-smtp');
    const name = 'smtp';

    let smtpClient;

    if (active && config['send-smtp-host']) {
        const smtpClientPort = config['send-smtp-port'];
        smtpClient = nodemailer.createTransport({
            host: config['send-smtp-host'],
            port: smtpClientPort,
            secure: smtpClientPort === 465,
            auth: config['send-smtp-user'] ? {
                user: config['send-smtp-user'],
                pass: config['send-smtp-pass']
            } : null,
            tls: {
                rejectUnauthorized: config['send-smtp-reject-invalid-tls-certs']
            }
        });
    }

    return {
        name: name,
        /**
         * Checks to see if message should be sent by this sender and the
         * recipient is whitelisted for email
         * @param {string} sendBy The name of the sender to send by
         * @param {NotificationMessage} message The message to send to Notify
         * @returns {boolean} true if the recipient is whitelisted, else false.
         */
        willSend: (sendBy, message) => {
            return sendBy === name &&
                active &&
                config['send-smtp-whitelist'].some(pattern => {
                    return minimatch(message.to, pattern);
                });
        },

        /**
         * Sends an e-mail via SMTP
         * @param {string} messageId The message id
         * @param {NotificationMessage} message The message to send via SMTP
         */
        send: (messageId, notificationMessage) => {
            // setup email data with unicode symbols
            const mailOptions = {
                from: config['send-smtp-from'],
                to: notificationMessage.to,
                subject: notificationMessage.subject,
                text: notificationMessage.text,
                html: notificationMessage.html ? notificationMessage.html : notificationMessage.text
            };

            return new Promise((resolve, reject) => {
                smtpClient.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(info);
                    }
                });
            });
        }
    };
};
