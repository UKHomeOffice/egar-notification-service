'use strict';

const describe = require('mocha').describe;
const it = require('mocha').it;
const afterEach = require('mocha').afterEach;
const expect = require('chai').expect;
const path = require('path');

const rootRequire = value => {
    return require(`../app/${value}`);
};

describe('logger', () => {
    afterEach(() => {
        delete require.cache[path.resolve(__dirname, '../../app/logger.js')];
    });

    it('Logs to console if log-console config value is true', () => {
        // Assign
        const stubConfig = {
            'log-console': true
        };

        const loggerInstance = rootRequire('logger')(stubConfig);

        // Assert
        expect(loggerInstance.transports).to.have.property('console');
    });

    it('Does not log to console if log-console config value is false', () => {
        // Assign
        const stubConfig = {
            'log-console': false
        };

        const loggerInstance = rootRequire('logger')(stubConfig);

        // Assert
        expect(loggerInstance.transports).not.to.have.property('console');
    });

    it('Logs to file if log-file config value is set', () => {
        // Assign
        const filename = 'message.log';
        const stubConfig = {
            'log-file': filename
        };

        const loggerInstance = rootRequire('logger')(stubConfig);

        // Assert
        expect(loggerInstance.transports).to.have.property('file');
        expect(loggerInstance.transports.file.filename).to.equal(filename);
    });

    it('Does not log to file if log-file config value is false', () => {
        // Assign
        const stubConfig = {
            'log-file': false
        };

        const loggerInstance = rootRequire('logger')(stubConfig);

        // Assert
        expect(loggerInstance.transports).not.to.have.property('file');
    });
});
