// native
const http = require('http');

// internal dependencies
const pkg = require('../package.json');

// internal dependencies
const hProject = require('../server');

var options = {
  port: process.env.PORT,
  apiVersion: pkg.version,

  mongodbURI: process.env.MONGODB_URI,
  rabbitMQURI: process.env.RABBIT_MQ_URI,

  hAccountURI: process.env.H_ACCOUNT_URI,
  hAccountToken: process.env.H_ACCOUNT_TOKEN,

  enablePrivateAPI: process.env.ENABLE_PRIVATE_API ? true : false,
  privateAPISecret: process.env.PRIVATE_API_SECRET,

  maxProjectFileSize: process.env.MAX_PROJECT_FILE_SIZE,

  // gcp
  gcpKeyFilename: process.env.TEST_GCP_KEY_FILENAME,
  gcpProjectId: process.env.TEST_GCP_PROJECT_ID,
  gcpBucket: process.env.TEST_GCP_BUCKET,

  corsWhitelist: process.env.CORS_WHITELIST,
};

// instantiate the app
var app = hProject(options);

// create http server and pass express app as callback
var server = http.createServer(app);

// start listening
server.listen(options.port, function () {
  console.log('HProject listening at port %s', options.port);
});
