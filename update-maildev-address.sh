maildev_ip=`sudo docker inspect -f "{{ .NetworkSettings.IPAddress }}" maildev`
sed_exec=''
echo "Updating /etc/hosts to include '$maildev_ip maildev'"

if grep -q maildev /etc/hosts; then
    sed_exec="sudo sed -i -e 's/.* maildev/$maildev_ip maildev/' /etc/hosts"
else
    sed_exec="sudo sed -i -e '1 s/^/$maildev_ip maildev\n/' /etc/hosts"
fi

eval $sed_exec
