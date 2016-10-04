// third-party
const Bluebird = require('bluebird');

// own
const errors = require('../../shared/errors');

/**
 * Retrieves a project by its code
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {Object} options
 * @return {Bluebird -> ProjectData}
 */
exports.get = function (authToken, identifier, options) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }

  if (!identifier) {
    return Bluebird.reject(new errors.InvalidOption('identifier', 'required', 'identifier is required'));
  }

  options = options || {};

  var query = {};
  if (options.byCode) {
    query.byCode = 'true';
  }

  return this._authReq(
    'GET',
    '/project/' + identifier,
    {
      authToken: authToken,
      query: query
    }
  );
};

/**
 * Retrieves a project by its code
 * @param  {String} authToken
 * @param  {String} projectIdentifier
 * @param  {Object} options
 * @return {Bluebird -> ProjectData}
 */
exports.getVersion = function (authToken, projectIdentifier, versionCode, options) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }

  if (!projectIdentifier) {
    return Bluebird.reject(new errors.InvalidOption('projectIdentifier', 'required', 'projectIdentifier is required'));
  }

  if (!versionCode) {
    return Bluebird.reject(new errors.InvalidOption('versionCode', 'required', 'versionCode is required'));
  }

  options = options || {};

  var query = {};
  if (options.byCode) {
    query.byCode = 'true';
  }

  if (options.distSignedURL) {
    query.distSignedURL = options.distSignedURL;
  }

  if (options.srcSignedURL) {
    query.srcSignedURL = options.srcSignedURL;
  }

  return this._authReq(
    'GET',
    '/project/' + projectIdentifier + '/version/' + versionCode,
    {
      authToken: authToken,
      query: query
    }
  );
};

exports.getLatestVersion = function (authToken, projectIdentifier, options) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }

  if (!projectIdentifier) {
    return Bluebird.reject(new errors.InvalidOption('projectIdentifier', 'required', 'projectIdentifier is required'));
  }

  options = options || {};

  var query = {};
  if (options.byCode) {
    query.byCode = 'true';
  }

  if (options.distSignedURL) {
    query.distSignedURL = options.distSignedURL;
  }

  if (options.srcSignedURL) {
    query.srcSignedURL = options.srcSignedURL;
  }

  console.log('GET LATEST VERSION!!!!')

  return this._authReq(
    'GET',
    '/project/' + projectIdentifier + '/versions/latest',
    {
      authToken: authToken,
      query: query
    }
  );
};
