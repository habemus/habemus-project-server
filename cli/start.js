// native
const http = require('http');

// third-party
const envOptions = require('@habemus/env-options');

const hProject = require('../server');

var options = envOptions({
  port: 'env:PORT',
  apiVersion: 'pkg:version',

  mongodbURI: 'fs:MONGODB_URI_PATH',
  rabbitMQURI: 'fs:RABBIT_MQ_URI_PATH',

  hAccountURI: 'env:H_ACCOUNT_URI',
  hAccountToken: 'fs:H_ACCOUNT_TOKEN_PATH',

  enablePrivateAPI: 'bool?:ENABLE_PRIVATE_API',
  privateAPISecret: 'fs?:PRIVATE_API_SECRET_PATH',

  maxProjectFileSize: 'env:MAX_PROJECT_FILE_SIZE',

  // gcp
  gcpKeyFilename: 'env:GCP_KEY_FILENAME',
  gcpProjectId: 'env:GCP_PROJECT_ID',
  gcpBucket: 'env:GCP_BUCKET',

  corsWhitelist: 'list:CORS_WHITELIST',
});

// instantiate the app
var app = hProject(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('h-project listening at port %s', options.port);
});
