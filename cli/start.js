// native
const http = require('http');

// third-party
const envOptions = require('@habemus/env-options');

const hProject = require('../server');

var options = envOptions({
  port: 'env:PORT',

  // data
  apiVersion: 'pkg:version',
  corsWhitelist: 'list:CORS_WHITELIST',
  maxProjectFileSize: 'env:MAX_PROJECT_FILE_SIZE',

  // services
  mongodbURI: 'fs:MONGODB_URI_PATH',
  rabbitMQURI: 'fs:RABBIT_MQ_URI_PATH',

  hAccountURI: 'env:H_ACCOUNT_URI',
  hAccountToken: 'fs:H_ACCOUNT_TOKEN_PATH',

  // gcp
  gcpKeyFilename: 'env:GCP_KEY_FILENAME',
  gcpProjectId: 'env:GCP_PROJECT_ID',
  gcpBucket: 'env:GCP_BUCKET',

  // private api
  enablePrivateAPI: 'bool?:ENABLE_PRIVATE_API',
  privateAPISecret: 'fs?:PRIVATE_API_SECRET_PATH',
});

// instantiate the app
var app = hProject(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('h-project listening at port %s', options.port);
});
