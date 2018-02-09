#!/bin/sh
. ./export-secrets.sh
. ./start-maildev.sh

rm -rf local-deployment.yml; envsubst < "local-deployment-template.yml" > "local-deployment.yml";

docker build --no-cache -f ./Dockerfile-local -t local-notification-service:latest .
docker-compose -f local-deployment.yml up -d
