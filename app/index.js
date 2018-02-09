'use strict';

const config = require('./config');
const logger = require('./logger')(config);
config.logger = logger;

const app = require('./lib').app(config);

app.start();
