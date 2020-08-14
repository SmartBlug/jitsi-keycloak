#!/bin/bash

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

#echo "127.0.0.1 $HOSTNAME" | sudo tee -a test > /dev/null
sudo sed -i '1i127.0.0.1 '$(hostname -f) /etc/hosts

# Install jitsi-meet-token
sudo apt-get -y install jitsi-meet-tokens

# Configure prosody
PROSODY_HOST_CONFIG="/etc/prosody/conf.avail/$HOSTNAME.cfg.lua"
PROSODY_CONFIG="/etc/prosody/prosody.cfg.lua"
APP_ID=$(echo "get jitsi-meet-tokens/appid" | sudo debconf-communicate | awk '{print $2}')
APP_SECRET=$(echo "get jitsi-meet-tokens/appsecret" | sudo debconf-communicate | awk '{print $2}')

sudo sed -i 's/--plugin_paths/plugin_paths/g' $PROSODY_HOST_CONFIG
sudo sed -i 's/authentication = "anonymous"/authentication = "token"/g' $PROSODY_HOST_CONFIG
##sudo sed -i 's/ --allow_unencrypted_plain_auth/ allow_unencrypted_plain_auth/g' $PROSODY_HOST_CONFIG
sudo sed -i "s/ --app_id=\"example_app_id\"/ app_id=\"$APP_ID\"/g" $PROSODY_HOST_CONFIG
sudo sed -i "s/ --app_secret=\"example_app_secret\"/ app_secret=\"$APP_SECRET\"\n        allow_empty_token=false/g" $PROSODY_HOST_CONFIG
sudo sed -i 's/-- "token_verification"/"token_verification"/g' $PROSODY_HOST_CONFIG

sudo chown root:prosody /etc/prosody/certs/localhost.key
sudo chmod 644 /etc/prosody/certs/localhost.key

# Install liarock
sudo apt-get -y install lua5.2  liblua5.2 luarocks
sudo luarocks install basexx
sudo apt-get -y install libssl1.0-dev
sudo luarocks install luacrypto

sudo luarocks download lua-cjson
sudo luarocks unpack lua-cjson-2.1.0.6-1.src.rock

echo -e 'function cdlua() {\ncd "./lua-cjson-2.1.0.6-1/lua-cjson"\n}\nfunction cdback() {\ncd "../../"\n}' > /tmp/cdlua
source /tmp/cdlua
cdlua
sudo sed -i '743s/.*/    len = lua_rawlen(l, -1);/' ./lua_cjson.c
sudo sed -i 's/#LUA_INCLUDE_DIR =   $(PREFIX)/LUA_INCLUDE_DIR = \/usr/' Makefile
sudo luarocks make
cdback
rm /tmp/cdlua
sudo luarocks install luajwtjitsi
# install again
sudo apt-get install -y jitsi-meet jitsi-meet-tokens
sudo rm /var/log/prosody/prosody.err

# Configure Guest Access
echo -e '\nVirtualHost "guest.'$(hostname -f)'"\n    authentication = "anonymous"\n    c2s_require_encryption = false' | sudo tee -a $PROSODY_HOST_CONFIG > /dev/null
sudo sed -i "s/\/\/ anonymousdomain: 'guest.example.com'/anonymousdomain: 'guest."$(hostname -f)"'/g" /etc/jitsi/meet/$(hostname -f)-config.js
# Enable requireDisplayName
sudo sed -i "s/\/\/ requireDisplayName:/requireDisplayName:/g" /etc/jitsi/meet/$(hostname -f)-config.js

# Change Jitsi Conference Focus
echo -e 'org.jitsi.jicofo.auth.URL=XMPP:'$(hostname -f) | sudo tee -a /etc/jitsi/jicofo/sip-communicator.properties > /dev/null

# Configure NGINX
sudo sed -i 's/# websockets for subdomains/# keycloak\n    location = \/keycloak\/keycloak {\n        proxy_pass      http:\/\/localhost:3000\/keycloak;\n        proxy_set_header X-Forwarded-For $remote_addr;\n        proxy_set_header Host $http_host;\n    }\n\n    location ~ ^\/keycloak\/(.*)$ {\n        proxy_pass       http:\/\/localhost:3000\/$1;\n        proxy_set_header X-Forwarded-For $remote_addr;\n        proxy_set_header Host $http_host;\n    }\n\n    # websockets for subdomains/g' /etc/nginx/sites-enabled/$(hostname -f).conf
echo -e '<script src="/keycloak/plugin"></script>' | sudo tee -a /usr/share/jitsi-meet/plugin.head.html

# Restart all Jitsi services
sudo service prosody restart
sudo service jicofo restart
sudo service jitsi-videobridge2 restart
sudo service nginx restart

# Install docker
sudo apt install -y docker.io
sudo usermod -aG docker $USER
# Install jitsi-keycloak image
sudo docker pull smartblug/jitsi-keycloak