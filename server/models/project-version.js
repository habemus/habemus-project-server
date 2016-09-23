// third-party dependencies
const mongoose = require('mongoose');
const uuid     = require('uuid');

// constants
const Schema = mongoose.Schema;

/**
 * Sub schema for the storage
 * @type {Object}
 */
const STORAGE = {
  /**
   * The identifier of the storage file on the storage provider
   * @type {String}
   */
  _id: String,

  /**
   * The storage provider (GCS, AWSS3)
   * @type {String}
   */
  provider: String,

  /**
   * Identifier of the version of the file at the provider.
   * @type {String}
   */
  generation: String,

  /**
   * Arbitrary metadata, so that we may accomodate multiple
   * storage provider requirements other than _id and generation
   * @type {Object}
   */
  meta: Object,
};

/**
 * Schema that defines a project version
 * @type {Schema}
 */
var projectVersion = new Schema({

  /**
   * Machine friendly private immutable identifier of the version
   * 
   * @type {Strin}
   */
  _id: {
    type: String,
    default: uuid.v4,
  },

  /**
   * Human and machine friendly public immutable identifier
   * 
   * @type {String}
   */
  code: {
    type: String,
    required: true,
  },

  /**
   * Number of the version. It should be auto incremented
   * 
   * @type {Number}
   */
  number: {
    type: Number,
    required: true,
  },

  /**
   * Identifier of the project this version refer to
   * @type {Ref -> Project}
   */
  projectId: {
    type: String,
    ref: 'Project',
    required: true,
  },

  /**
   * Location of source files of the version
   * 
   * @type {Storage}
   */
  srcStorage: STORAGE,

  /**
   * Location of dist files of the version
   * 
   * @type {Storage}
   */
  distStorage: STORAGE,

  /**
   * Date at which the version was created
   * @type {Date}
   */
  createdAt: {
    type: Date,
    default: Date.now
  },
});

// takes the connection and options and returns the model
module.exports = function (conn, app, options) {
  var ProjectVersion = conn.model('ProjectVersion', projectVersion);
  
  return ProjectVersion;
};