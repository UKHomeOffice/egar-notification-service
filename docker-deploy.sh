#!/bin/sh
NAME="${1}"
version=$(./utils/get-site-version.sh)

docker login -u="ukhomeofficedigital+egar_robot" -p=${DOCKER_PASSWORD} quay.io
docker tag $NAME:$version quay.io/ukhomeofficedigital/$NAME:$version
docker push quay.io/ukhomeofficedigital/$NAME:$version

docker tag $NAME:$version quay.io/ukhomeofficedigital/$NAME:latest
docker push quay.io/ukhomeofficedigital/$NAME:latest
