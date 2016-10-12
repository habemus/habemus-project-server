// native dependencies
const path = require('path');
const http = require('http');

// third-party dependencies
const MongoClient = require('mongodb').MongoClient;
const enableDestroy = require('server-destroy');
const should = require('should');
const Bluebird = require('bluebird');
const fse = require('fs-extra');

// own dependencies
const fileApp = require('./file-app');

if (process.env.DEBUG === 'TRUE') {
  // set mongoose to debug mode
  require('mongoose').set('debug', true);
}

// make all these checks as it is very dangerous to
// use production gcp stuff for the tests.
// It is not possible to setup a local 'gcp storage'
// as we do with mongodb
if (!process.env.TEST_GCP_KEY_FILENAME) {
  throw new Error('ATTENTION! TEST_GCP_KEY_FILENAME envvar is required for tests');
}

if (!process.env.TEST_GCP_PROJECT_ID) {
  throw new Error('ATTENTION! TEST_GCP_PROJECT_ID envvar is required for tests');
}

if (!process.env.TEST_GCP_BUCKET) {
  throw new Error('ATTENTION! TEST_GCP_BUCKET envvar is required for tests');
}

// constants
const TEST_DB_URI = 'mongodb://localhost:27017/h-project-test-db';
const TEST_RABBIT_MQ_URI = 'amqp://192.168.99.100';
const TMP_PATH = path.join(__dirname, '../tmp');
const FIXTURES_PATH = path.join(__dirname, '../fixtures');

exports.defaultOptions = {
  apiVersion: '0.0.0',

  // h-account
  hAccountURI: 'http://localhost:4001',
  hAccountToken: 'ACCOUNT_TOKEN',

  // private api
  enablePrivateAPI: true,
  privateAPISecret: 'FAKE-SECRET',

  corsWhitelist: 'http://localhost:4000,http://some-other-url.com',
  mongodbURI: TEST_DB_URI,
  rabbitMQURI: TEST_RABBIT_MQ_URI,
  maxProjectFileSize: '2MB',

  // gcp
  gcpKeyFilename: process.env.TEST_GCP_KEY_FILENAME,
  gcpProjectId: process.env.TEST_GCP_PROJECT_ID,
  gcpBucket: process.env.TEST_GCP_BUCKET,
};

exports.tmpPath = TMP_PATH;
exports.fixturesPath = FIXTURES_PATH;

/**
 * Used to reject successful promises that should have not been fulfilled
 * @return {Bluebird Rejection}
 */
exports.errorExpected = function () {
  return Bluebird.reject(new Error('error expected'));
};

exports.logError = function (err) {
  console.warn(err);

  throw err;
};

exports.wait = function (ms) {
  return new Bluebird((resolve, reject) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Starts a server and keeps reference to it.
 * This reference will be used for teardown.
 */
exports.startServer = function (port, app) {

  if (!port) { throw new Error('port is required'); }
  if (!app) { throw new Error('app is required'); }

  // create http server and pass express app as callback
  var server = http.createServer();

  // make the server destroyable
  enableDestroy(server);

  server.on('request', app);

  return new Promise((resolve, reject) => {
    server.listen(port, () => {

      // register the server to be tore down
      exports.registerTeardown(function () {
        return new Promise(function (resolve, reject) {
          server.destroy((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        })
      });

      // resolve with the server
      resolve(server);
    });
  });
};

/**
 * Sets up an assets object that is ready for the tests
 * @return {[type]} [description]
 */
exports.setup = function () {

  var _assets = {};

  fse.emptyDirSync(TMP_PATH);

  exports.registerTeardown(function () {
    fse.emptyDirSync(TMP_PATH);
  });

  return MongoClient.connect(TEST_DB_URI)
    .then((db) => {
      _assets.db = db;

      // register teardown
      exports.registerTeardown(function () {

        // drop database
        return db.dropDatabase().then(() => {
          return db.close();
        });
      });

      return db.dropDatabase();
    })
    .then(() => {
      // create a file app
      _assets.fileApp = fileApp({
        filesDir: FIXTURES_PATH,
      });
      _assets.fileAppURI = 'http://localhost:4001';
      
      return exports.startServer(4001, _assets.fileApp);
    })
    .then(() => {
      return _assets;
    });
};

var TEARDOWN_CALLBACKS = [];

/**
 * Register a teardown function to be executed by the teardown
 * The function should return a promise
 */
exports.registerTeardown = function (teardown) {
  TEARDOWN_CALLBACKS.push(teardown);
};

/**
 * Executes all functions listed at TEARDOWN_CALLBACKS
 */
exports.teardown = function () {
  return Promise.all(TEARDOWN_CALLBACKS.map((fn) => {
    return fn();
  }))
  .then(() => {
    TEARDOWN_CALLBACKS = [];
  });
};

/**
 * Clones a given object
 */
exports.clone = function clone(obj) {
  var cloneObj = {};

  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      cloneObj[prop] = obj[prop];
    }
  }

  return cloneObj;
}
