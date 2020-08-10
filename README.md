# JITSI-KEYCLOAK

[![Latests Version](https://img.shields.io/github/package-json/v/SmartBlug/jitsi-keycloak?label=current%20version)](https://github.com/SmartBlug/jitsi-keycloak)
[![Latests Build](https://img.shields.io/github/package-json/build/SmartBlug/jitsi-keycloak)](https://github.com/SmartBlug/jitsi-keycloak)
[![Known Vulnerabilities](https://snyk.io/test/github/SmartBlug/jitsi-keycloak/badge.svg)](https://snyk.io/test/github/SmartBlug/jitsi-keycloak)
[![Docker Automated buil](https://img.shields.io/docker/automated/smartblug/jitsi-keycloak.svg)](https://hub.docker.com/r/smartblug/jitsi-keycloak)
[![Latest Release](https://img.shields.io/github/release/SmartBlug/jitsi-keycloak?label=latest%20release)](https://github.com/SmartBlug/jitsi-keycloak/releases)

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=SmartBlug%40SmartExtension.com&item_name=jitsi-keycloak&currency_code=EUR&source=url)

Keycloak Plugin for Jitsi

# Usage
Keycloak parameters are defined in the config file or through the JITSI-KEYCLOAK_KEYCLOAK env variable
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
You also need to setup JITSI-KEYCLOAK_JITSI_URL with your jitsi server url (ex: "https://meet.mydomain.com")

# Installation
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
> enter contact@ztag.me
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

### Configure Prosody
```
nano /etc/prosody/conf.d/$(hostname -f).cfg.lua
```
add new virtual host
```
VirtualHost "guest.meet.mydomain.com"
    authentication = "anonymous"
    c2s_require_encryption = false
```
### Add guest domain to Jitsi Meet frontend
```
sudo nano /etc/jitsi/meet/$(hostname -f)-config.js
```
> add the directive anonymousdomain into your hosts object.
```
hosts: {
  // XMPP domain.
  domain: 'meet.mydomain.com',

  // When using authentication, domain for guest users.
  anonymousdomain: 'guest.meet.mydomain.com',
  ...
```
### Change Jitsi Conference Focus
```
sudo nano /etc/jitsi/jicofo/sip-communicator.properties
```
> add `org.jitsi.jicofo.auth.URL=XMPP:meet.mydomain.com` at the end of the file
```
...
org.jitsi.jicofo.auth.URL=XMPP:meet.mydomain.com
```
### Restart  all Jitsi services involved
```
service prosody restart
service jicofo restart
service jitsi-videobridge2 restart
service nginx restart
```


## Configure your NGINX
- modify your nginx config (`/etc/nginx/sites-enabled/meet.mydomain.com.conf`)
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
- modify `/usr/share/jitsi-meet/plugin.head.html` with
```
<script src="/keycloak/plugin"></script>
```

## Run your docker with the keycloak parameters
```
bash
$ docker run -p 0.0.0.0:3000:3000 -e JITSI-KEYCLOAK_JITSI_URL="https://meet.mydomain.com" -e JITSI-KEYCLOAK_KEYCLOAK='{"front":{"realm":"realm_meet","auth-server-url":"https://iam.mydomain.com/auth","ssl-required":"external","resource":"frontend_meet","public-client":true,"confidential-port":0},"back":{"realm":"global","bearer-only":true,"auth-server-url":"https://iam.mydomain.com/auth","ssl-required":"external","resource":"backend_meet","confidential-port":0}}' smartblug/jitsi-keycloak
```

## Enjoy your secured conferences
- Use on of the 2 options :
    - Connect to your https://meet.mydomain.com/ and use the 
    "Sign In" button
    - Go directly in a room and press the "I am the host" button...

- In both case, you'll be redirected to your keycloak server and then enjoy your conference