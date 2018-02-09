#!/bin/sh
NAME="${1}"
version=$(./utils/get-site-version.sh)

docker build -t $NAME:$version .
