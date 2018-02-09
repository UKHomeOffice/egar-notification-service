. ./setenv.sh

rm -rf maildev-compose.yml; envsubst < "maildev-compose-template.yml" > "maildev-compose.yml";

docker-compose -f maildev-compose.yml up -d
