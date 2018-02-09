'use strict';

const _ = require('lodash');
const describe = require('mocha').describe;
const it = require('mocha').it;
const beforeEach = require('mocha').beforeEach;
const afterEach = require('mocha').afterEach;
const expect = require('chai').expect;
const spy = require('sinon').spy;

const rootRequire = modulePath => {
    return require(`../app/${modulePath}`);
};


describe('config', () => {
    let savedArgv;
    let stubLogger;

    beforeEach(() => {
        savedArgv = _.cloneDeep(process.argv);
        stubLogger = {
            error: spy()
        };
    });

    afterEach(() => {
        process.argv = savedArgv;

        /* eslint-disable no-console */
        if (console.error.restore) {
            console.error.restore();
        }
        /* eslint-enable */
        delete require.cache[require.resolve('../app/config')];
    });

    it('Uses sensible config value defaults when not overridden', () => {
        const config = rootRequire('config');
        expect(config).to.deep.include({
            'active-profiles': ['producer', 'listen-rest', 'listen-smtp', 'consumer', 'send-notify'],
            'log-level': 'info',
            'log-console': true,
            'log-file': false,
            'fake-queue': false,
            'receive-email-whitelist': ['*'],
            'notification-request-queue-region': 'eu-west-2',
            'listen-api-port': 8088,
            'listen-smtp-port': 2525,
            'require-sent-by': ['notify', 'smtp'],
            'send-notify-whitelist': ['*'],
            'send-smtp-port': 25,
            'send-smtp-whitelist': ['*'],
            'send-smtp-reject-invalid-tls-cert': false,
            'send-redis-hosts': ['localhost'],
            'send-lock-ttl': 30 * 1000,
        });
    });

    it('Allows any config variable to be overridden by application arguments', () => {
        const argConfig = {
            'active-profiles': 'producer,listen-rest',
            'log-level': 'debug',
            'log-console': 'message.log',
            'log-file': false,
            'fake-queue': true,
            'receive-email-whitelist': 'sender@keycloak.gov.uk,admin@keycloak.gov.uk',
            'notification-request-queue-region': 'eu-west-1',
            'listen-api-port': 8888,
            'listen-smtp-port': 25,
            'require-sent-by': '',
            'send-notify-whitelist': '*@gov.uk',
            'send-smtp-port': 465,
            'send-smtp-whitelist': '*@ukhomeoffice.gov.uk',
            'send-smtp-reject-invalid-tls-cert': true,
            'send-redis-hosts': 'redis1:6359,redis2:6359',
            'send-lock-ttl': 60 * 1000,
        };

        Object.keys(argConfig).forEach(key => {
            process.argv.push(`--${key}=${argConfig[key]}`);
        });

        const config = rootRequire('config');
        expect(config).to.deep.include({
            'active-profiles': ['producer', 'listen-rest'],
            'log-level': 'debug',
            'log-console': 'message.log',
            'log-file': false,
            'fake-queue': true,
            'receive-email-whitelist': ['sender@keycloak.gov.uk', 'admin@keycloak.gov.uk'],
            'notification-request-queue-region': 'eu-west-1',
            'listen-api-port': 8888,
            'listen-smtp-port': 25,
            'require-sent-by': [''],
            'send-notify-whitelist': ['*@gov.uk'],
            'send-smtp-port': 465,
            'send-smtp-whitelist': ['*@ukhomeoffice.gov.uk'],
            'send-smtp-reject-invalid-tls-cert': true,
            'send-redis-hosts': ['redis1:6359', 'redis2:6359'],
            'send-lock-ttl': 60 * 1000,
        });
    });

    it('Will not validate if the producer profile is active' +
        ' but the notification-request-queue* config variables' +
        ' are not specified as application arguments', () => {
            // Assign
            process.argv.push('--active-profiles=producer');
            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.false;
            expect(stubLogger.error.calledWith(
                'Required config setting \'notification-request-queue-access-key-id\' not provided.'
            )).to.be.true;
            expect(stubLogger.error.calledWith(
                'Required config setting \'notification-request-queue-secret-key\' not provided.'
            )).to.be.true;
            expect(stubLogger.error.calledWith(
                'Required config setting \'notification-request-queue-url\' not provided.'
            )).to.be.true;
    });

    it('Validates if the producer profile is active' +
        ' and the notification-request-queue* config variables' +
        ' are specified as application arguments', () => {
            // Assign
            process.argv.push(
                '--active-profiles=producer',
                '--notification-request-queue-access-key-id=abcd1234',
                '--notification-request-queue-secret-key=wxyz9876',
                '--notification-request-queue-url=https://queueurl.test'
            );

            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.true;
            expect(stubLogger.error.notCalled).to.be.true;
    });

    it('Validates if the producer profile is active' +
        ' and the fake-queue config variable is true' +
        ' and the notification-request-queue* config variables' +
        ' are not specified as application arguments', () => {
            // Assign
            process.argv.push(
                '--active-profiles=producer',
                '--fake-queue=true'
            );

            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.true;
            expect(stubLogger.error.notCalled).to.be.true;
    });

    it('Will not validate if the consumer profile is active' +
        ' but the notification-request-queue* config variables' +
        ' are not specified as application arguments', () => {
            // Assign
            process.argv.push('--active-profiles=consumer');
            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.false;
            expect(stubLogger.error.calledWith(
                'Required config setting \'notification-request-queue-access-key-id\' not provided.'
            )).to.be.true;
            expect(stubLogger.error.calledWith(
                'Required config setting \'notification-request-queue-secret-key\' not provided.'
            )).to.be.true;
            expect(stubLogger.error.calledWith(
                'Required config setting \'notification-request-queue-url\' not provided.'
            )).to.be.true;
    });

    it('Validates if the consumer profile is active' +
        ' and the notification-request-queue* config variables' +
        ' are specified as application arguments', () => {
            // Assign
            process.argv.push(
                '--active-profiles=consumer',
                '--notification-request-queue-access-key-id=abcd1234',
                '--notification-request-queue-secret-key=wxyz9876',
                '--notification-request-queue-url=https://queueurl.test'
            );

            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.true;
            expect(stubLogger.error.notCalled).to.be.true;
    });

    it('Validates if the producer profile is active' +
        ' and the fake-queue config variable is true' +
        ' and the notification-request-queue* config variables' +
        ' are not specified as application arguments', () => {
            // Assign
            process.argv.push(
                '--active-profiles=consumer',
                '--fake-queue=true'
            );

            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.true;
            expect(stubLogger.error.notCalled).to.be.true;
    });

    it('Will not validate if the send-notify profile is active' +
        ' but the send-notify-api-key config variable' +
        ' is not specified as an application argument', () => {
            // Assign
            process.argv.push('--active-profiles=send-notify');
            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.false;
            expect(stubLogger.error.calledWith(
                'Required config setting \'send-notify-api-key\' not provided.'
            )).to.be.true;
    });

    it('Validates if the send-notify profile is active' +
        ' and the send-notify-api-key config variable' +
        ' is specified as an application argument', () => {
            // Assign
            process.argv.push(
                '--active-profiles=send-notify',
                '--send-notify-api-key=abcd1234'
            );
            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.true;
            expect(stubLogger.error.notCalled).to.be.true;
    });

    it('Will not validate if the send-smtp profile is active' +
        ' but the send-smtp-host and send-smtp-from config variables' +
        ' are not specified as application arguments', () => {
            // Assign
            process.argv.push('--active-profiles=send-smtp');
            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.false;
            expect(stubLogger.error.calledWith('Required config setting \'send-smtp-host\' not provided.')).to.be.true;
            expect(stubLogger.error.calledWith('Required config setting \'send-smtp-from\' not provided.')).to.be.true;
    });

    it('Validates if the send-smtp profile is active' +
        ' and the send-smtp-host and send-smtp-from config variables' +
        ' are specified as application arguments', () => {
            // Assign
            process.argv.push(
                '--active-profiles=send-smtp',
                '--send-smtp-host=mailsender',
                '--send-smtp-from=the@sender.foo'
            );
            const config = rootRequire('config');
            config.logger = stubLogger;

            // Act + Assert
            expect(config.validate()).to.be.true;
            expect(stubLogger.error.notCalled).to.be.true;
    });
});
