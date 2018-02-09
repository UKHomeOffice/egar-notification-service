'use strict';

const _ = require('lodash');
const parseArgs = require('minimist');

// Parse the command used to start the application,
// Ignore the node executable and the script name
const processConfig = parseArgs(process.argv.slice(2));

const profileRequiredKeyMap = {
    'producer': {
        bypassCheck: ['fake-queue'],
        properties: [
            'notification-request-queue-access-key-id',
            'notification-request-queue-secret-key',
            'notification-request-queue-url'
        ]
    },
    'consumer': {
        bypassCheck: ['fake-queue'],
        properties: [
            'notification-request-queue-access-key-id',
            'notification-request-queue-secret-key',
            'notification-request-queue-url'
        ]
    },
    'send-notify': {
        properties: ['send-notify-api-key']
    },
    'send-smtp': {
        properties: [
            'send-smtp-host',
            'send-smtp-from'
        ]
    }
};

/**
 * Tries parsing a value to a boolean,
 * If the value cannot be parsed, the original value will be returned
 * @param {*} value The value to try to parse
 */
const tryParseBoolString = value => {
    let retVal = value;

    if (typeof (value) === 'string') {
        if (value.toLowerCase() === 'true') {
            retVal = true;
        } else if (value.toLowerCase() === 'false') {
            retVal = false;
        }
    }

    return retVal;
};

/**
 * Turns e.g.
 * 'a,b' => ['a', 'b']
 * ['a,b', 'c', 2] => ['a', 'b', 'c', 2]
 * @param {*} value The value to turn in to a flat array
 * @returns {Array} The flattened array
 */
const makeFlatArray = value => {
    return _.flatten(_.map(_.castArray(value), v => {
        if (typeof (v) === 'string') {
            return v.split(',');
        }

        return v;
    }));
};

// Apply defaults in case no config variables were supplied on the command line
const config = _.defaultsDeep({}, processConfig, {
    'active-profiles': 'producer,listen-rest,listen-smtp,consumer,send-notify',
    'log-level': 'info',
    'log-console': true,
    'log-file': false,
    'notification-request-queue-region': 'eu-west-2',
    'listen-api-port': 8088,
    'listen-smtp-port': 2525,
    'require-sent-by': 'notify,smtp',
    'receive-email-whitelist': '*',
    'send-notify-whitelist': '*',
    'send-smtp-port': 25,
    'send-smtp-whitelist': '*',
    'send-smtp-reject-invalid-tls-cert': false,
    'send-redis-hosts': 'localhost',
    'send-lock-ttl': 30 * 1000,
    'fake-queue': false,
    validate: () => {
        let valid = true;

        config['active-profiles'].forEach(p => {
            const requiredConfig = profileRequiredKeyMap[p] || {};

            const bypassCheck = (requiredConfig.bypassCheck || []).some(k => config[k]);

            if (!bypassCheck) {
                const requiredProperties = requiredConfig.properties || [];
                requiredProperties.forEach(r => {
                    if (!config[r]) {
                        valid = false;
                        config.logger.error(`Required config setting '${r}' not provided.`);
                    }
                });
            }
        });

        return valid;
    }
});

// Ensure array type variables are flat arrays
[
    'active-profiles',
    'require-sent-by',
    'receive-email-whitelist',
    'send-notify-whitelist',
    'send-smtp-whitelist',
    'send-redis-hosts'
].forEach(v => {
    config[v] = makeFlatArray(config[v]);
});

// Ensure possible boolean type variables are boolean,
// if they are the string representations of booleans.
// Will not coerce to true if the string is non-empty but not 'true'.
[
    'log-console',
    'log-file',
    'fake-queue',
    'send-smtp-reject-invalid-tls-cert'
].forEach(v => {
    config[v] = tryParseBoolString(config[v]);
});

if (config['fake-queue']) {
    // Avoids the need for SQS
    config.fakeMessageQueue = [];
}

/**
 * Provides config to be used in the eGAR applications
 */
module.exports = config;
