#!/bin/sh
kubectl create -f /home/centos/egar-notification-service/scripts/kube/maildev-deployment.yaml
kubectl create -f /home/centos/egar-notification-service/scripts/kube/maildev-service.yaml
kubectl create -f /home/centos/egar-notification-service/scripts/kube/notification-service-deployment.yaml
kubectl create -f /home/centos/egar-notification-service/scripts/kube/notification-service-service.yaml
