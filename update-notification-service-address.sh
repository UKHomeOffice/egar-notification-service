egar_notification_service_ip=`sudo docker inspect -f "{{ .NetworkSettings.IPAddress }}" egar-notification-service`
sed_exec=''
echo "Updating /etc/hosts to include '$egar_notification_service_ip egar-notification-service'"

if grep -q egar-notification-service /etc/hosts; then
    sed_exec="sudo sed -i -e 's/.* egar-notification-service/$egar_notification_service_ip egar-notification-service/' /etc/hosts"
else
    sed_exec="sudo sed -i -e '1 s/^/$egar_notification_service_ip egar-notification-service\n/' /etc/hosts"
fi

eval $sed_exec
