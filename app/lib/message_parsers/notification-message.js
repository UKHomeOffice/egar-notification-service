'use strict';
const _ = require('lodash');

class NotificationMessage {
    constructor(config) {
        _.assign(this,
            _.pick(config, [
                'notificationTemplateId',
                'type',
                'to',
                'personalisation',
                'subject',
                'text',
                'html'
            ])
        );
    }
}

module.exports = NotificationMessage;
