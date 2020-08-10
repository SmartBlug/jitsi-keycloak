'use strict';
const path = require('path');
const fsp = require('fs-promise');
const Package = require('./package.json');

// Default Config
// Do not edit this, generate a config.<ENV>.js for your NODE_ENV
// or use ENV-VARS like JITSI_KEYCLOAK_PORT=8000
const config =  {
  "uploadDir": path.resolve(__dirname + '/data'),
  "iface": '0.0.0.0',
  // set to false to disable HTTP
  "port": 3000,
  // HTTPS, set all 3 values to enable
  "sslPort": 8443,
  "sslKeyFile": false,
  "sslCertFile": false,
  // Force redirect to https
  // can be true or a specific url like https://example.com:8443
  // keep empty to disable
  "forceHttps": '',
  "appPath": '/',
  "accessLog": ':date[iso] :method :url :status :response-time :remote-addr',
  "appId": "myappid",
  "appSecret": "myappsecret",
  "jitsiUrl": "https://meet.jitsi.com",
  "keycloak": { front:null, back:{} }
};

// Load NODE_ENV specific config
const envConfFile = path.resolve(__dirname, `config.${process.env.NODE_ENV}.js`);
if(process.env.NODE_ENV && fsp.existsSync(envConfFile)) {
  Object.assign(config, require(envConfFile));
}

// Load config from ENV VARS
let envName;
for (let k in config) {
  envName = Package.name.toUpperCase() + "_" + k.replace(/([A-Z])/g, $1 => "_" + $1).toUpperCase();
  if(process.env[envName]) {
    if(typeof config[k] === 'number') {
      config[k] = parseInt(process.env[envName], 10);
    } else if (typeof config[k] === 'object') {
      config[k] = JSON.parse(process.env[envName]);
    } else {
      config[k] = process.env[envName];
    }
  }
}

module.exports = config;