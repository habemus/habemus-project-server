// third-party dependencies
const jwt         = require('jsonwebtoken');
const MongoClient = require('mongodb').MongoClient;
const gulp        = require('gulp');
const gulpNodemon = require('gulp-nodemon');

// tests
const istanbul    = require('gulp-istanbul');
const mocha       = require('gulp-mocha');

const DEV_DB_URI = 'mongodb://localhost:27017/h-project-test-db';
const TEST_SECRET = 'SHHHH';

gulp.task('pre-test', function () {
  return gulp.src(['server/controllers/**/*.js', 'server/models/**/*.js'])
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function () {
  return gulp.src(['test/tests/**/*.js'])
    .pipe(mocha())
    // Creating the reports after tests ran
    .pipe(istanbul.writeReports())
    // Enforce a coverage of at least 70%
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 70 } }))
    .on('error', (err) => {
      console.log('======================================================================');
      console.log('REMEMBER TO CHANGE PERMISSIONS OF GCP_KEY_FILE BACK TO RESTRICTED MODE');
      console.log('======================================================================');
      this.emit('error', err);
    })
    .on('end', () => {
      console.log('======================================================================');
      console.log('REMEMBER TO CHANGE PERMISSIONS OF GCP_KEY_FILE BACK TO RESTRICTED MODE');
      console.log('======================================================================');
    });
});

/**
 * Drops the database
 */
gulp.task('drop-db', function (done) {
  // connect
  var _db;

  MongoClient.connect(DEV_DB_URI)
    .then((db) => {
      _db = db;
      return db.dropDatabase();
    })
    .then(() => {
      return _db.close(true, done);
    })
    .catch(done);
});

/**
 * Run server and restart it everytime server file changes
 */
gulp.task('nodemon', function () {
  gulpNodemon({
    script: 'cli/dev-start.js',
    env: {
      PORT: 5000,

      MONGODB_URI: DEV_DB_URI,
      RABBIT_MQ_URI: 'amqp://192.168.99.100',

      ENABLE_PRIVATE_API: 'true',
      PRIVATE_API_SECRET: TEST_SECRET,

      MAX_PROJECT_FILE_SIZE: '5MB',

      CORS_WHITELIST: 'http://localhost:3000',
    },
    ext: 'js',
    ignore: [
      'client/**/*',
      'dist/**/*',
      'gulpfile.js',
    ],
  })
});

gulp.task('token', function () {
  var payload = {};
  
  var token = jwt.sign(payload, TEST_SECRET, {
    expiresIn: '1d',
    subject: 'test',
  });
  console.log(token);
});
