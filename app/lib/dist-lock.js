'use strict';
const redis = require('redis');
const Redlock = require('redlock');

const DEFAULT_REDIS_PORT = 6379;

module.exports = config => {
    const log = config.logger;

    let redisHosts = config['send-redis-hosts'];
    if (!Array.isArray(redisHosts)) {
        redisHosts = [redisHosts];
    }

    const redisClients = redisHosts.map(h => {
        const parts = h.split(':');

        return redis.createClient(parts.length > 1 ? parseInt(parts[1], 10) : DEFAULT_REDIS_PORT, parts[0]);
    });

    const redlock = new Redlock(redisClients, {
        driftFactor: 0.02,
        retryCount: 15,
        retryDelay: 200,
        retryJitter: 234
    });


    redlock.on('clientError', err => {
        log.error(err);
    });

    return {
        /**
         * Obtains a distributed lock on a message.
         * Providing all consumer instances are locking
         * via the same data stores, it provides assurance
         * that a message will only be processed once.
         * @param {NotificationMessage} message The message that the consumer wants to process.
         * @returns {Promise} A promise that resolves with the lock, or rejects if getting the lock is not possible.
         */
        getLock(message) {
            const resource = `locks:message:${message.id}`;
            const timeToLive = config['send-lock-ttl'];

            log.debug(`Obtaining lock for message ${message.id}`);
            return redlock.lock(resource, timeToLive);
        },

        /**
         * Releases a previously obtained lock
         * @param {Redlock.Lock} lock The lock to release
         */
        releaseLock(lock) {
            log.debug(`Releasing lock ${lock.value}`);
            lock.unlock().catch(err => {
                log.error(err);
            });
        }
    };
};
