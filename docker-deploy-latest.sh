#!/bin/sh
NAME="${1}"

docker tag $NAME:$version pipe.egarteam.co.uk/$NAME:latest
docker push pipe.egarteam.co.uk/$NAME:latest
