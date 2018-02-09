'use strict';
const winston = require('winston');
const _ = require('lodash');

/**
 * @returns A configured Logger instance
 * @param {Object} config The micro-service config containing:
 *      @field {string} log-level One of 'error', 'warn', 'info', 'debug', 'verbose'.
 *      @field {boolean} log-console true to log to the console, else false.
 *      @field {boolean|string} log-file false to disable logging to a file, or the path of the file to log to.
 */
module.exports = config => {
    const transports = [];
    const defaultTransportConfig = {
        level: config['log-level'],
        // log unhandled exceptions
        handleExceptions: true,
        humanReadableUnhandledException: true
    };

    if (config['log-console']) {
        transports.push(new (winston.transports.Console)(defaultTransportConfig));
    }

    if (config['log-file']) {
        transports.push(new (winston.transports.File)(
            _.assign(_.clone(defaultTransportConfig), { filename: config['log-file'] })
        ));
    }

    const logger = new (winston.Logger)({
        transports: transports,
        // Don't exit on uncaught exceptions
        exitOnError: false
    });


    return logger;
};
