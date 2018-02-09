#!/bin/sh
kubectl delete -f /home/centos/egar-notification-service/scripts/kube/maildev-deployment.yaml
kubectl delete -f /home/centos/egar-notification-service/scripts/kube/maildev-service.yaml
kubectl delete -f /home/centos/egar-notification-service/scripts/kube/notification-service-deployment.yaml
kubectl delete -f /home/centos/egar-notification-service/scripts/kube/notification-service-service.yaml
