FROM quay.io/ukhomeofficedigital/nodejs-base:v6.11.1

RUN rpm --rebuilddb
RUN yum -y install epel-release
RUN yum -y install redis

RUN mkdir -p /app
WORKDIR /app

COPY package.json .
RUN npm install

COPY start.sh .
COPY .eslintignore .
COPY .eslintrc .
COPY app/ /app/app
COPY test/ /app/test

RUN npm run-script test

EXPOSE 8088
EXPOSE 2525

RUN chmod 755 start.sh
ENTRYPOINT ["/app/start.sh"]
