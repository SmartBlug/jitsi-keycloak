#!/bin/bash

## To RUN : bash <(wget -qO- https://raw.githubusercontent.com/SmartBlug/jitsi-keycloak/master/scripts/install-no-keycloak.sh)

# Update ubuntu
sudo apt update
sudo apt -y upgrade

# Install prosody
sudo wget https://prosody.im/files/prosody-debian-packages.key -O- | sudo apt-key add -
echo deb http://packages.prosody.im/debian $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list

sudo apt-get -y update
sudo apt-get -y install prosody

# Install jitsi
wget -qO - https://download.jitsi.org/jitsi-key.gpg.key | sudo apt-key add -
sudo sh -c "echo 'deb https://download.jitsi.org stable/' > /etc/apt/sources.list.d/jitsi-stable.list"

sudo apt-get -y update
sudo apt-get -y install jitsi-meet

for FILE in `eval ls /etc/jitsi/meet/*.js`
do
  echo $FILE > /tmp/hostname
done

sed -i 's/\/etc\/jitsi\/meet\///g' /tmp/hostname
sed -i 's/-config.js//g' /tmp/hostname

HOSTNAME=$(cat /tmp/hostname)

sudo hostnamectl set-hostname $HOSTNAME

sudo add-apt-repository -y ppa:certbot/certbot
sudo apt -y install certbot

sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh

sudo sed -i '1i127.0.0.1 '$(hostname -f) /etc/hosts

# Restart all Jitsi services
sudo service prosody restart
sudo service jicofo restart
sudo service jitsi-videobridge2 restart
sudo service nginx restart

### Customize
echo "Enter url for customization:"
# in the folder of that url, you need
# - watermark.png
# - logo.png
# - favicon.ico
# - ssh (with the SSH key to add to .ssh/authorized_keys)
# - redirect (with redirect url when you click on the logo ex:"https:\/\/www.sample.com")
read customurl

### Icon
sudo wget -O /usr/share/jitsi-meet/images/watermark.png $customurl/watermark.png
sudo wget -O /usr/share/jitsi-meet/favicon.ico $customurl/favicon.ico
sudo wget -O /usr/share/jitsi-meet/images/logo.png $customurl/logo.png
sudo wget $customurl/ssh
sudo wget $customurl/redirect

### Add Key
echo "`cat ssh`" >> /home/ubuntu/.ssh/authorized_keys

### Config - Desktop sharing
sudo sed -i "s/\/\/ Desktop sharing/\/\/ Desktop sharing\n    desktopSharingFrameRate: {\n      min: 15,\n      max: 25\n    },\n/g" /etc/jitsi/meet/$(hostname -f)-config.js
### Config - Enable requireDisplayName
sudo sed -i "s/\/\/ requireDisplayName:/requireDisplayName:/g" /etc/jitsi/meet/$(hostname -f)-config.js
### Config - Enable prejoinPage
sudo sed -i "s/\/\/ prejoinPageEnabled: false/prejoinPageEnabled: true/g" /etc/jitsi/meet/$(hostname -f)-config.js


### Config interface
sudo sed -i "s/APP_NAME: 'Jitsi Meet'/APP_NAME: 'Meet'/g" /usr/share/jitsi-meet/interface_config.js
sudo sed -i "s/JITSI_WATERMARK_LINK: 'https:\/\/jitsi.org'/JITSI_WATERMARK_LINK: '`cat redirect`'/g" /usr/share/jitsi-meet/interface_config.js
sudo sed -i "s/jitsilogo.png/logo.png/g" /usr/share/jitsi-meet/title.html

# Clean
sudo rm ssh
sudo rm redirect
sudo rm wget-log

# End
# 
echo $'\n\nInstallation completed\n'