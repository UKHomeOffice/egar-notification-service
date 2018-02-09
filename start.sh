#!/bin/sh
cd /app
redis-server &

node ./app/index.js "$@"
