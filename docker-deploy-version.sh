#!/bin/sh
NAME="${1}"
version=$(./utils/get-site-version.sh)

docker tag $NAME:$version pipe.egarteam.co.uk/$NAME:$version
docker push pipe.egarteam.co.uk/$NAME:$version
