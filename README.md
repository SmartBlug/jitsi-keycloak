# JITSI-KEYCLOAK

[![Latests Version](https://img.shields.io/github/package-json/v/SmartBlug/jitsi-keycloak?label=current%20version)](https://github.com/SmartBlug/jitsi-keycloak)
[![Latests Build](https://img.shields.io/github/package-json/build/SmartBlug/jitsi-keycloak)](https://github.com/SmartBlug/jitsi-keycloak)
[![Known Vulnerabilities](https://snyk.io/test/github/SmartBlug/jitsi-keycloak/badge.svg)](https://snyk.io/test/github/SmartBlug/jitsi-keycloak)
[![Docker Automated buil](https://img.shields.io/docker/automated/smartblug/jitsi-keycloak.svg)](https://hub.docker.com/r/smartblug/jitsi-keycloak)
[![Latest Release](https://img.shields.io/github/release/SmartBlug/jitsi-keycloak?label=latest%20release)](https://github.com/SmartBlug/jitsi-keycloak/releases)

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=SmartBlug%40SmartExtension.com&item_name=jitsi-keycloak&currency_code=EUR&source=url)

Keycloak Plugin for Jitsi

# Usage
Keycloak parameters are defined in the config file or through the env variable
- JITSI-KEYCLOAK_APP_ID = `'myappid'`
- JITSI-KEYCLOAK_APP_SECRET = `'myappsecret'`
- JITSI-KEYCLOAK_JITSI_URL = `'https://meet.mydomain.com'`
- JITSI-KEYCLOAK_KEYCLOAK
```
{
    "front": {
      "realm": "realm_meet",
      "auth-server-url": "https://iam.mydomain.com/auth/",
      "ssl-required": "external",
      "resource": "frontend_meet",
      "public-client": true,
      "confidential-port": 0
    },
    "back": {
      "realm": "realm_meet",
      "bearer-only": true,
      "auth-server-url": "https://iam.mydomain.com/auth/",
      "ssl-required": "external",
      "resource": "backend_meet",
      "confidential-port": 0
    }
  }
```
## How to use
- Start a conference with your favorite URL `https://meet.mydomain.com/myconference` or through the portal `https://meet.mydomain.com`
- If you are a guest, just wait
- If you are the host, press "I am the host" and you'll be authenticated through your keycloak server
- If you are already authenticated, just go in the room

## Tips
- You can also sign in or sign out through the portal `https://meet.mydomain.com`
- Your displayed name will be your "real" name comming from keycloak

# Automatic Installation
- Start with a fresh Ubuntu 18.04.4
- wget installation script and run
```
wget -O - https://github.com/SmartBlug/jitsi-keycloak/blob/master/scripts/install.sh | bash
```
- answer questions while the script will execute
> Your password for sudo<br>
> Your server url : `meet.mydomain.com`<br>
> Chose `create a new self-signed certificate`<br>
> Enter your email to create letsencrypt certificate<br>
> Enter your APP ID : `myappid`<br>
> Enter your APP Secret : `myappsecret`<br>
- launch your docker
```
$ docker run -p 0.0.0.0:3000:3000 -e JITSI-KEYCLOAK_APP_ID="myappid" -e JITSI-KEYCLOAK_APP_SECRET="myappsecret" -e JITSI-KEYCLOAK_JITSI_URL="https://meet.mydomain.com" -e JITSI-KEYCLOAK_KEYCLOAK='{"front":{"realm":"realm_meet","auth-server-url":"https://iam.mydomain.com/auth","ssl-required":"external","resource":"frontend_meet","public-client":true,"confidential-port":0},"back":{"realm":"realm_meet","bearer-only":true,"auth-server-url":"https://iam.mydomain.com/auth","ssl-required":"external","resource":"backend_meet","confidential-port":0}}' -i -d --restart always smartblug/jitsi-keycloak
```
- enjoy

# Manual Installation
## Install Jitsi with last prosody support
- Add dns for meet.mydomain.com to point to your vm public ip
- Open ports on network security group
    - 80/tcp
    - 443/tcp
    - 4443/tcp
    - 10000/udp
- Change hostname
```
sudo hostnamectl set-hostname meet.mydomain.com
```
- Edit `/etc/hosts` and append
```
127.0.0.1 meet.mydomain.com
```
- Install prosody
```
wget https://prosody.im/files/prosody-debian-packages.key -O- | sudo apt-key add -
echo deb http://packages.prosody.im/debian $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list

sudo apt-get -y update
sudo apt-get -y install prosody
```
- Install Jitsi
```
wget -qO - https://download.jitsi.org/jitsi-key.gpg.key | sudo apt-key add -
sudo sh -c "echo 'deb https://download.jitsi.org stable/' > /etc/apt/sources.list.d/jitsi-stable.list"

sudo apt-get -y update
sudo apt-get -y install jitsi-meet
```
> manually type your server name `meet.mydomain.com`<br>
> chose `self-signed cert for now`

- install letsencrypt certificate
```
sudo add-apt-repository ppa:certbot/certbot
sudo apt -y install certbot

sudo /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```
> enter contact@mydomain.com
- Install jitsi-meet-tokens
```
sudo apt-get -y install jitsi-meet-tokens
```
> enter myappid<br>
> enter myappsecret
- Configure prosody
```
sudo nano /etc/prosody/prosody.cfg.lua
```
> change c2s_require_encryption=false
```
sudo nano /etc/prosody/conf.avail/meet.mydomain.com.cfg.lua
```
> authentication="token"<br>
> app_id="myappid"<br>
> app_secret="myappsecret"<br>
> allow_empty_token=false<br>
> further down remove comment from -- "token_verifification"

- Fix permissions on localhost key
```
sudo chown root:prosody /etc/prosody/certs/localhost.key
sudo chmod 644 /etc/prosody/certs/localhost.key
```
- Install luarocks
```
sudo apt-get -y install lua5.2  liblua5.2 luarocks
sudo luarocks install basexx
sudo apt-get install libssl1.0-dev
sudo luarocks install luacrypto

sudo luarocks download lua-cjson
sudo luarocks unpack lua-cjson-2.1.0.6-1.src.rock
cd lua-cjson-2.1.0.6-1/lua-cjson/

sudo nano lua_cjson.c 
```
> change line 743 to
```
            len = lua_rawlen(l, -1);
```
- prepare Makefile
```
sudo nano Makefile
```
> change  
```
            LUA_INCLUDE_DIR =   /usr/include/lua5.2
```
- make
```
sudo luarocks make
cd ../../

sudo luarocks install luajwtjitsi
```

- install again
```
sudo apt-get install -y jitsi-meet jitsi-meet-tokens

sudo rm /var/log/prosody/prosody.err
```
- restart services
```
sudo systemctl restart prosody.service
sudo systemctl restart jicofo.service
sudo systemctl restart jitsi-videobridge2.service
```

## Configuration guest access

- Configure Prosody
```
sudo nano /etc/prosody/conf.d/$(hostname -f).cfg.lua
```
> Add new virtual host
```
VirtualHost "guest.meet.mydomain.com"
    authentication = "anonymous"
    c2s_require_encryption = false
```
- Add guest domain to Jitsi Meet frontend
```
sudo nano /etc/jitsi/meet/$(hostname -f)-config.js
```
> Add the directive anonymousdomain into your hosts object.
```
hosts: {
  // XMPP domain.
  domain: 'meet.mydomain.com',

  // When using authentication, domain for guest users.
  anonymousdomain: 'guest.meet.mydomain.com',
  ...
```
> [optional] require display name for your guest, this is more friendly.
```
    requireDisplayName: true,
```
- Change Jitsi Conference Focus
```
sudo nano /etc/jitsi/jicofo/sip-communicator.properties
```
> add `org.jitsi.jicofo.auth.URL=XMPP:meet.mydomain.com` at the end of the file
```
...
org.jitsi.jicofo.auth.URL=XMPP:meet.mydomain.com
```

## Configure your NGINX
- modify your nginx config (`/etc/nginx/sites-enabled/meet.mydomain.com.conf`)
```
sudo nano /etc/nginx/sites-enabled/$(hostname -f).conf
```
> Add
```
    # keycloak
    location = /keycloak/keycloak {
        proxy_pass      http://localhost:3000/keycloak;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }

    location ~ ^/keycloak/(.*)$ {
        proxy_pass       http://localhost:3000/$1;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Host $http_host;
    }
```

## Modify Jitsi to add plugin
- modify `/usr/share/jitsi-meet/plugin.head.html`
```
sudo nano /usr/share/jitsi-meet/plugin.head.html
```
> Add
```
<script src="/keycloak/plugin"></script>
```

## Restart  all Jitsi services involved
```
sudo service prosody restart
sudo service jicofo restart
sudo service jitsi-videobridge2 restart
sudo service nginx restart
```

## Install docker
```
sudo apt install -y docker.io
sudo usermod -aG docker $USER
```
- Restart your shell session

## Run your docker with the keycloak parameters
```
$ docker run -p 0.0.0.0:3000:3000 -e JITSI-KEYCLOAK_APP_ID="myappid" -e JITSI-KEYCLOAK_APP_SECRET="myappsecret" -e JITSI-KEYCLOAK_JITSI_URL="https://meet.mydomain.com" -e JITSI-KEYCLOAK_KEYCLOAK='{"front":{"realm":"realm_meet","auth-server-url":"https://iam.mydomain.com/auth","ssl-required":"external","resource":"frontend_meet","public-client":true,"confidential-port":0},"back":{"realm":"realm_meet","bearer-only":true,"auth-server-url":"https://iam.mydomain.com/auth","ssl-required":"external","resource":"backend_meet","confidential-port":0}}' -i -d --restart always smartblug/jitsi-keycloak
```

## Enjoy