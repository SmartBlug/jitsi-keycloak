const config = require('./config.js');
const express = require('express');
const morgan = require('morgan');
const Package = require('./package.json');
const path = require('path');
const bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');

const Keycloak = require('keycloak-connect')
const kc = new Keycloak({}, config.keycloak.back);

const app = express();

//*****************************************************

//app.use(compression());
app.use(bodyParser.json());

if (config.accessLog) {
  app.use(morgan(config.accessLog));
}

//*****************************************************

// Static files
app.use('/app', express.static(path.join(__dirname, './public/app')));
app.use('/assets', express.static(path.join(__dirname, './public/assets')));
app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, './public/robots.txt'));
});

// Keycloak
app.get('/keycloak', (req, res) => {
  if (config.keycloak.front) res.sendFile(path.join(__dirname, './public/app/keycloak.js'));
  else res.end();
});
app.get('/keycloak.json', (req, res) => {
  const keycloakFront = config.keycloak.front;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(keycloakFront));
});

// Token
app.post('/token', (req, res) => {
  const data = {
    "context": {
      "user": {
        "avatar": "https:/gravatar.com/avatar/abc123",
        "name": req.body.name,
        "email": req.body.email
      }
    },
    "aud": config.jitsiURL,
    "iss": config.appId,
    "sub": config.jitsiURL,
    "room": req.body.room
  };
  
  var token = jwt.sign(data, config.appSecret);
  res.json({
    room:req.body.room,
    token:token,
    url:config.jitsiURL+'/'+req.body.room+'?jwt='+token,
    version: Package.version+' build '+Package.build
  });
});

// App
app.get('/', (req, res) => {
  if (config.appPath !== '/') {
    res.status(304).redirect(config.appPath);
  } else {
    res.sendFile(path.join(__dirname, './public/html/index.html'));
  }
});
app.get('/:room', (req, res) => {
  console.log(req.params.room);
  res.sendFile(path.join(__dirname, './public/html/index.html'));
});

//*****************************************************

let server;
if(config.port) {
  // HTTP Server
  server = app.listen(config.port, config.iface, () => {
    console.log(Package.name,`listening on http://${config.iface}:${config.port}`);
    if (config.keycloak.front) console.log(`Keycloak activated`);
  });
}

let httpsServer;
if(config.sslPort && config.sslKeyFile && config.sslCertFile) {
  // HTTPS Server
  const sslOpts = {
    key: fs.readFileSync(config.sslKeyFile),
    cert: fs.readFileSync(config.sslCertFile)
  };
  httpsServer = https.createServer(sslOpts, app)
    .listen(config.sslPort, config.iface, () => {
      console.log(Package.name,`listening on https://${config.iface}:${config.sslPort}`);
      if (config.keycloak.front) console.log(`Keycloak activated`);
    });
}

// graceful shutdown
function shutdown() {
  console.log(Package.name,'shutting down...');
  if(server) {
    server.close(() => {
      server = false;
      if(!server && !httpsServer) process.exit(0);
    });
  }
  if(httpsServer) {
    httpsServer.close(() => {
      httpsServer = false;
      if(!server && !httpsServer) process.exit(0);
    });
  }
  setTimeout(function() {
    console.log('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 60 * 1000);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);