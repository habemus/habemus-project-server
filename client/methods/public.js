// third-party
const Bluebird = require('bluebird');
const xhrUpload = require('xhr-upload');

const errors = require('../../shared/errors');

/**
 * Creates a new project
 * @param  {String} authToken
 * @param  {Object} projectData
 * @return {Bluebird -> ProjectData}
 */
exports.create = function (authToken, projectData) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }

  if (!projectData.name) {
    return Bluebird.reject(new errors.InvalidOption('name', 'required', 'name is required'));
  }

  return this._authReq(
    'POST',
    '/projects',
    {
      authToken: authToken,
      send: projectData,
    }
  );
};

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
 * Lists projects filtered by a query
 * @param  {String} authToken
 * @return {Bluebird -> Array [ProjectDta]}
 */
exports.list = function (authToken) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }

  return this._authReq(
    'GET',
    '/projects',
    {
      authToken: authToken,
    }
  )
  .then(function (data) {
    return data.items;
  });
};

/**
 * Schedules a project for future removal.
 * The project won't be listed anymore.
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {Object} options
 * @return {Bluebird}
 */
exports.scheduleRemoval = function (authToken, identifier, options) {
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
    'DELETE',
    '/project/' + identifier,
    {
      authToken: authToken,
      query: query
    }
  );
};

/**
 * Updates a project's data
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {Object} projectData
 * @return {Bluebird -> ProjectData}
 */
exports.update = function (authToken, identifier, projectData, options) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }

  if (!identifier) {
    return Bluebird.reject(new errors.InvalidOption('identifier', 'required', 'identifier is required'));
  }

  if (!projectData) {
    return Bluebird.reject(new errors.InvalidOption('projectData', 'required'));
  }

  options = options || {};

  var query = {};
  if (options.byCode) {
    query.byCode = 'true';
  }

  return this._authReq(
    'PUT',
    '/project/' + identifier,
    {
      authToken: authToken,
      query: query,
      send: projectData
    }
  );
};

/**
 * Updates the code of the project
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {String} targetCode
 * @return {Bluebird -> ProjectData}
 */
exports.updateCode = function (authToken, identifier, targetCode, options) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }
  if (!identifier) {
    return Bluebird.reject(new errors.InvalidOption('identifier', 'required'));
  }
  if (typeof targetCode !== 'string') {
    return Bluebird.reject(new errors.InvalidOption('targetCode', 'typeerror'));
  }

  options = options || {};

  var query = {};
  if (options.byCode) {
    query.byCode = 'true';
  }

  return this._authReq(
    'PUT',
    '/project/' + identifier + '/code',
    {
      authToken: authToken,
      query: query,
      send: {
        code: targetCode
      }
    }
  );
};

/**
 * Creates a version of a project given a zipFile
 * 
 * @param  {String} identifier
 * @param  {File} zipFile
 * @param  {Object} options
 * @return {QPromise}
 */
exports.createVersion = function (authToken, projectIdentifier, zipFile, options) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }
  if (!projectIdentifier) { return Bluebird.reject(new errors.InvalidOption('projectIdentifier', 'required')); }
  if (!zipFile) { return Bluebird.reject(new errors.InvalidOption('zipFile', 'required')); }

  // check the file type
  // if it is not empty, it must be 'application/zip'
  if (zipFile.type !== '' && zipFile.type !== 'application/zip') {
    return Bluebird.reject(new errors.InvalidOption(
      'zipFile',
      'type',
      'the file must have mime-type application/zip'
    ));
  }

  // check file size
  if (zipFile.size > 52428800) {
    return Bluebird.reject(new errors.MaxFilesizeExceeded(52428800));
  }

  options = options || {};
  options.headers = options.headers || {};
  options.headers['Authorization'] = 'Bearer ' + authToken;

  // the destination URL
  var destinationURL = this.serverURI + '/project/' + projectIdentifier + '/versions';

  if (options.byCode) {
    destinationURL += '?byCode=true';
  }

  // execute the upload
  var upload = xhrUpload(destinationURL, zipFile, options);

  return upload;
};

/**
 * Lists the versions of a given project
 * 
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {Object} options
 * @return {Bluebird -> Array}
 */
exports.listVersions = function (authToken, identifier, options) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }
  if (!identifier) { return Bluebird.reject(new errors.InvalidOption('identifier', 'required')); }

  options = options || {};

  var query = {};
  if (options.byCode) {
    query.byCode = 'true';
  }

  return this._authReq(
    'GET',
    '/project/' + identifier + '/versions',
    {
      authToken: authToken,
      query: query,
    }
  )
  .then((data) => {
    return data.items;
  });
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
