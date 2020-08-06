Keycloak Plugin for Jitsi

### Docker
```
bash
$ docker run -p 0.0.0.0:3000:3000 -e JITSI_KEYCLOAK='{"front":{"realm":"global","auth-server-url":"http://192.168.5.4:8080/auth","ssl-required":"external","resource":"jitsi_FrontEnd","public-client":true,"confidential-port":0},"back":{"realm":"global","bearer-only":true,"auth-server-url":"http://192.168.5.4:8080/auth","ssl-required":"external","resource":"BackEnd","confidential-port":0}}' smartblug/jitsi_keycloak
```

## Configure your NGINX
```
    # keycloak
    location ~ ^/keycloak/(.*)$ {
        proxy_pass       http://localhost:3000/$1;
    }
```