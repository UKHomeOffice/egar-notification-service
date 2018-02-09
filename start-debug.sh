#!/bin/sh
cd /app
redis-server &

node --inspect ./app/index.js "$@"
