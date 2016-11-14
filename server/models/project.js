// third-party dependencies
const mongoose   = require('mongoose');
const Bluebird   = require('bluebird');
const uuid       = require('uuid');
const makeStatus = require('mongoose-make-status');
const makeACLs   = require('mongoose-make-acls');

// constants
const CONSTANTS = require('../../shared/constants');
const Schema = mongoose.Schema;

/**
 * Each domain label must be 63 characters or less
 * https://tools.ietf.org/html/rfc1034#section-3.5
 * @type {Number}
 */
const CODE_MAX_CHAR_LENGTH = 63;

/**
 * Matches uppercase characters
 * @type {RegExp}
 */
const UPPERCASE_RE = /[A-Z]/;

/**
 * Schema that defines a project
 * @type {Schema}
 */
var projectSchema = new Schema({

  /**
   * Machine friendly immutable identifier of the project
   * 
   * @type {Object}
   */
  _id: {
    type: String,
    default: uuid.v4,
  },

  /**
   * Machine and friendly public identifier of the project
   * @type {String}
   */
  code: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: function(code) {
        var respectsMaxLength = code.length <= CODE_MAX_CHAR_LENGTH;
        var isLowerCase = !UPPERCASE_RE.test(code);

        return (respectsMaxLength && isLowerCase);
      },
      message: 'code must have less than ' + CODE_MAX_CHAR_LENGTH + ' chars',
    },
  },
  
  /**
   * A human readable name for the project
   * 
   * @type {String}
   */
  name: {
    type: String,
    required: true,
  },

  /**
   * When the project was created
   * @type {Date}
   */
  createdAt: {
    type: Date,
    default: Date.now
  },

  /**
   * When the project was last updated
   * @type {Object}
   */
  updatedAt: {
    type: Date,
    required: true,
  },

  /**
   * Metadata on the project
   * @type {Object}
   */
  meta: Object,
});

/**
 * Create status schema and methods
 */
makeStatus(projectSchema, {
  statuses: CONSTANTS.VALID_PROJECT_STATUSES,
});

/**
 * Create acls schema and methods
 */
makeACLs(projectSchema, {
  permissionScopes: CONSTANTS.VALID_PROJECT_PERMISSIONS,
});

/**
 * Keep `updatedAt` property updated
 */
projectSchema.pre('validate', function (next) {

  this.updatedAt = Date.now();

  next();
});

// takes the connection and options and returns the model
module.exports = function (conn, app, options) {

  /**
   * Attempts to save the project with a given targetSafeName.
   *
   * If the code is taken, retries up to ${maxRetries} times.
   *
   * @param  {String} targetSafeName
   * @param  {Number} maxRetries
   * @param  @private {String} _random
   * @return {Bluebird -> Project}
   */
  projectSchema.methods.saveRetryCode = function (targetSafeName, maxRetries, _random) {

    maxRetries = maxRetries || 0;
    _random    = _random || '';

    // make space for the _random digits at the end
    // code must have at most 63 characters
    var attempt = targetSafeName.substring(0, CODE_MAX_CHAR_LENGTH - _random.length);
    attempt += _random;

    this.set('code', attempt);

    return Bluebird.resolve(this.save())
      .catch((err) => {
        // TODO: study better implementations for unique error detecting
        // const codePropErrRe = /.*\scode.*\sdup/;
        // 
        // current reference is https://docs.mongodb.com/manual/core/index-unique/
        // 
        // if (err.code === 11000 && codePropErrRe.test(err.errmsg)) {
        if (err.code === 11000) {
          if (maxRetries > 0) {
            var newRandom = '-' + Math.floor(Math.random() * 10000).toString();

            return this.saveRetryCode(targetSafeName, maxRetries - 1, newRandom);
          }
        } else {
          return Bluebird.reject(err);
        }
      });
  };
    
  var Project = conn.model('Project', projectSchema);
  
  return Project;
};