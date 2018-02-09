'use strict';

const describe = require('mocha').describe;
const it = require('mocha').it;
const after = require('mocha').after;
const afterEach = require('mocha').afterEach;
const before = require('mocha').before;
const beforeEach = require('mocha').beforeEach;
const expect = require('chai').expect;
const mock = require('sinon').mock;
const stub = require('sinon').stub;
const spy = require('sinon').spy;
const path = require('path');


// const fakeProcessedMessage = {};
const stubLogger = {
    error: () => {}
};
let stubConfig;


const stubMessageListeners = stub().returns({
    start: spy()
});

const stubMessageParsers = stub().returns({
    process: () => {}
});

const stubQueueProducer = stub().returns({
    enqueue: () => {}
});

const stubMessageSenders = stub().returns({
    send: spy()
});

const stubQueueConsumer = stub().returns({
    start: spy()
});

const lock = { value: '1234' };
const stubDistLock = stub().returns({
    getLock: stub().returns(lock),
    releaseLock: spy()
});

const rootRequire = modulePath => {
    return require(`../../app/${modulePath}`);
};

const stubbedModules = [];
const stubModule = (modulePath, moduleStub) => {
    const fullPath = path.resolve(__dirname, `../../app/${modulePath}`);

    require.cache[fullPath].exports = moduleStub;
    stubbedModules.push(fullPath);
};

const restoreStubbedModules = () => {
    stubbedModules.forEach(s => {
        delete require.cache[s];
    });
};

const fakeProcessedMessage = {
    // to, type, text, html etc.
};

describe('app', () => {
    let app;
    let appInstance;


    before(() => {
        // Prep the require cache
        require('events');
        rootRequire('lib/message_listeners');
        rootRequire('lib/message_parsers');
        rootRequire('lib/queue-producer');
        rootRequire('lib/message_senders');
        rootRequire('lib/queue-consumer');
        rootRequire('lib/dist-lock');

        // Overwrite the loaded modules
        stubModule('lib/message_listeners/index.js', stubMessageListeners);
        stubModule('lib/message_parsers/index.js', stubMessageParsers);
        stubModule('lib/queue-producer.js', stubQueueProducer);
        stubModule('lib/message_senders/index.js', stubMessageSenders);
        stubModule('lib/queue-consumer.js', stubQueueConsumer);
        stubModule('lib/dist-lock.js', stubDistLock);

        app = require(path.join(__dirname, '../../app/lib')).app;
    });

    after(() => {
        // Clear the stubs from the require cache
        restoreStubbedModules();
    });

    beforeEach(() => {
        stubConfig = {
            'api-port': 8888,
            'smtp-port': 2555,
            'active-profiles': ['producer', 'listen-rest', 'listen-smtp', 'consumer', 'send-notify'],
            logger: stubLogger
        };

        appInstance = app(stubConfig);
    });

    afterEach(() => {
        stubMessageListeners.resetHistory();
        stubMessageParsers.resetHistory();
        stubQueueProducer.resetHistory();
        stubMessageSenders.resetHistory();
        stubQueueConsumer.resetHistory();
        stubDistLock.resetHistory();
    });

    it('Provides an instance of the config to all other modules', () => {
        // Act
        appInstance.start();

        // Assert
        expect(stubMessageListeners.getCall(0).args[0]).to.equal(stubConfig);
        expect(stubMessageParsers.getCall(0).args[0]).to.equal(stubConfig);
        expect(stubQueueProducer.getCall(0).args[0]).to.equal(stubConfig);
        expect(stubMessageSenders.getCall(0).args[0]).to.equal(stubConfig);
        expect(stubQueueConsumer.getCall(0).args[0]).to.equal(stubConfig);
        expect(stubDistLock.getCall(0).args[0]).to.equal(stubConfig);
    });

    it('Only initialises the listener + parser + producer' +
        ' modules if started in producer-only mode', () => {
        // Assign
        stubConfig['active-profiles'] = ['producer', 'listen-rest', 'listen-smtp'];
        appInstance = app(stubConfig);

        // Act
        appInstance.start();

        // Assert
        expect(stubMessageListeners.called).to.be.true;
        expect(stubMessageParsers.called).to.be.true;
        expect(stubQueueProducer.called).to.be.true;
        expect(stubMessageSenders.notCalled).to.be.true;
        expect(stubQueueConsumer.notCalled).to.be.true;
        expect(stubDistLock.notCalled).to.be.true;
        expect(stubMessageListeners().start.called).to.be.true;
    });

    it('Only initialises the consumer + dist-lock + sender' +
        ' modules if started in consumer-only mode', () => {
        // Assign
        stubConfig['active-profiles'] = ['consumer', 'send-notify', 'send-smtp'];
        appInstance = app(stubConfig);

        // Act
        appInstance.start();

        // Assert
        expect(stubMessageListeners.notCalled).to.be.true;
        expect(stubMessageParsers.notCalled).to.be.true;
        expect(stubQueueProducer.notCalled).to.be.true;
        expect(stubMessageSenders.called).to.be.true;
        expect(stubQueueConsumer.called).to.be.true;
        expect(stubDistLock.called).to.be.true;
        expect(stubQueueConsumer().start.called).to.be.true;
    });


    describe('on message received', () => {
        beforeEach(() => {
            appInstance.start();
        });

        afterEach(() => {
            if (stubMessageParsers().process.restore) {
                stubMessageParsers().process.restore();
            }

            if (stubQueueProducer().enqueue.restore) {
                stubQueueProducer().enqueue.restore();
            }
        });

        it('Uses message parsers to process incoming messages, ' +
            'and the processing queue to send outgoing messages', () => {
            // Assign
            const incomingMessage = {};
            const callback = spy();

            mock(stubMessageParsers()).expects('process').withArgs(incomingMessage).returns(fakeProcessedMessage);
            mock(stubQueueProducer()).expects('enqueue').withArgs(fakeProcessedMessage);

            // Act
            stubMessageListeners.getCall(0).args[0].messageEvent.emit(
                'incoming-message-received',
                incomingMessage,
                callback
            );

            // Assert
            mock.verify();
            expect(callback.calledWith(undefined)).to.be.true;
        });

        it('Logs, then returns an error if a problem occurs during the processing of a message', () => {
            // Assign
            const incomingMessage = {};
            const callback = spy();

            const error = new Error('Message not processed');
            mock(stubLogger).expects('error').withArgs(error);
            stub(stubMessageParsers(), 'process').throws(error);

            // Act
            stubMessageListeners.getCall(0).args[0].messageEvent.emit(
                'incoming-message-received',
                incomingMessage,
                callback
            );
                        // Assert
            mock.verify();
            expect(callback.calledWith(error)).to.be.true;
        });
    });
});
