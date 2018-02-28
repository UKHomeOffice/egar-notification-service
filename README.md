# egar-notification-service
This package centralises the sending of messages outside of the EGAR system.
It can accept incoming messages via SMTP or a RESTful API.
It can send outgoing messages via SMTP or to the GovUK Notification Service (Notify)

The typical flow through the service (or pair of services) is:
```producer```: Listener -> Parser -> SQS Queue Producer -> SQS Queue
```consumer```: SQS Queue -> SQS Queue Consumer -> Sender

An individual service instance can act as a producer, or a consumer, or both.


The SQS Queue provides resilience for temporary service outages.
Listeners, Processors and Senders all implement simple interfaces, it is trivial to implement one to extend the functionality of the service.
In

## Getting started (production)
### Creating the SQS Queue
In the AWS management console, go to the Simple Queue Services management page.
Create a new standard queue with the following settings:
```
- Queue Name: Notification_DeadLetter_<environment> // where environment is (e.g.) Dev<User>/Demo/Live etc
- Everything else: Accept defaults
```
The Dead Letter Queue is to allow triage if messages fail to send.

Create another standard queue for messages to be sent to:

```
- Queue Name: Notification_Request_<environment> // where environment is (e.g.) Dev<User>/Demo/Live etc
- Default Visibility Timeout: 60 seconds // the time a message will be invisible to other consumers whilst being processed
- Message Retention Period: 4 days // how long a message will be kept unprocessed
- Maximum Message Size: 256KB
- Delivery Delay: 0 seconds // deliver messages as soon as possible
- Receive Message Wait Time: 20 seconds // if the queue is empty, wait 20 seconds before returning a poll request (reduces chattiness)
- Use Redrive Policy: Yes
- Dead Letter Queue: Notification_DeadLetter_<environment> // where messages will be put if they fail to send
- Maximum Receives: 10 // the number of times a message can fail to send before being sent to the dead letter queue
```
Make a note of the URI of the Request Queue, you'll need to configure the Notification Service instances with it.

### Creating an AWS IAM to access the Queue
In the AWS management console, go to the IAM (Manage User Access and Encryption Keys).
Create a user that will access the queue. Grant the user AmazonSQSFullAccess.

Make a note of the user's Access Key Id and Secret Key, you'll need to configure the Notification Service instances with them.

### Deploy Redis instances
The notification service can work with N Redis instances (1+).

The number that should be deployed is relative to how important it is considered to not send messages twice.
In production, it is recommended to deploy at least three separate instances. A single instance (even a single instance with failover) is unreliable for ensuring mutual exclusion (see: https://redis.io/topics/distlock#why-failover-based-implementations-are-not-enough for more information on this).

## Getting started (development)
If you need to test with AWS SQS, follow the SQS instructions for production.
It is possible to run the service without needing access to SQS for development purposes.

The development docker image/machines can run with a single Redis instance.


## Running the service
### Command line parameters:
```
- log-console: (Optional) false to disable logging to console (default: true)
- log-file: (Optional) false to disable logging to file, or the file to log to (default: message.log)
- log-level: (Optional) One of:  error|warn|info|verbose|debug|silly. Messages below the chosen level will not be logged. (default: info)
- active-profiles: A combination of: producer|listen-rest|listen-smtp|consumer|send-notify|send-smtp:
    - producer: Starts the service with open interfaces for receiving messages from external services. Produces a queue of messages for a 'consumer' to process.
    - listen-rest: (For producers only) Starts the service with an active REST API listener
    - listen-smtp: (For producers only) Starts the service with an active SMTP Server listener
    - consumer: Starts the service to listen to a produced queue of messages to send.
    - send-notify: (For consumers only) starts the service with an active GovUK Notify sender
    - send-smtp: (For consumers only) starts the service with an active SMTP email sender
```
### Command line parameters for producers
```
- require-sent-by: A Combination of: notify|smtp - A message is only considered 'complete' if successfully sent by a sender with the matching key.

EITHER:
- notification-request-queue-access-key-id: The SQS user Access Key id
- notification-request-queue-secret-key: The SQS user Secret Access Key
- notification-request-queue-url: The notification queue URL
- notification-request-queue-region: (Optional) The region the queue resides in (default: eu-west-2)
OR:
- fake-queue: true to avoid the need for SQS, uses a local array to pass messages between the producer and consumer modules
```
#### Command line parameters for REST listeners
```
- api-port: (Optional) The port to start the REST API listener on (default: 8088)
```
#### Command line parameters for SMTP listeners
```
- listen-smtp-port: (Optional) The port to start the SMTP listener on (default: 2525)
```

### Command line parameters for consumers
```
- send-redis-hosts: A comma delimited list of Redis hosts + ports, e.g. 'red1:6339,red2:6330' (default for development: 'localhost')
- send-lock-ttl: (Optional) The maximum lock time for a message (default: 30 seconds)

EITHER:
- notification-request-queue-access-key-id: The SQS user Access Key id
- notification-request-queue-secret-key: The SQS user Secret Access Key
- notification-request-queue-url: The notification request queue URL
- notification-request-queue-region: (Optional) The region the queue resides in (default: eu-west-2)
OR:
- fake-queue: true to avoid the need for SQS, uses a local array to pass messages between the producer and consumer modules
```

#### Command line parameters for Notify senders
```
- send-notify-api-key: The Notification API user key
- send-notify-whitelist: (Optional) A list of e-mail addresses/glob match patterns for addresses whitelisted to send via Notify, e.g '*@civica.co.uk,specific@foo.com'
```

#### Command line parameters for SMTP senders
```
- send-smtp-host: The onward SMTP server host
- send-smtp-from: The sender e-mail address to put on outgoing messages
- send-smtp-port: (Optional) The onward SMTP server port
- send-smtp-user: (Optional) The user name for the onward SMTP server
- send-smtp-pass: (Optional) The password for the onward SMTP server
- send-smtp-whitelist: (Optional) A list of e-mail addresses/glob match patterns for addresses whitelisted to send via SMTP , e.g '*@civica.co.uk,specific@foo.com'
- send-smtp-reject-invalid-tls-certs: (Optional) Reject connection to the SMTP server if its TLS cert is invalid (default: false)
```
