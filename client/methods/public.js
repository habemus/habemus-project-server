// third-party
const Bluebird = require('bluebird');

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
      body: projectData,
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
  if (options.byId) {
    query.byId = 'true';
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
  );
};

/**
 * Schedules a project for future removal.
 * The project won't be listed anymore.
 * @param  {String} authToken
 * @param  {String} identifier
 * @param  {Object} options
 * @return {Bluebird}
 */
exports.delete = function (authToken, identifier, options) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }

  if (!identifier) {
    return Bluebird.reject(new errors.InvalidOption('identifier', 'required', 'identifier is required'));
  }

  options = options || {};

  var query = {};
  if (options.byId) {
    query.byId = 'true';
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
  if (options.byId) {
    query.byId = 'true';
  }

  return this._authReq(
    'PUT',
    '/project/' + identifier,
    {
      authToken: authToken,
      query: query,
      body: projectData
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
  if (options.byId) {
    query.byId = 'true';
  }

  return this._authReq(
    'PUT',
    '/project/' + identifier + '/code',
    {
      authToken: authToken,
      query: query,
      body: {
        code: targetCode
      }
    }
  );
};

exports.listVersions = function (authToken, identifier, options) {
  if (!authToken) { return Bluebird.reject(new errors.Unauthorized()); }
  if (!identifier) { return Bluebird.reject(new errors.InvalidOption('identifier', 'required')); }

  options = options || {};

  var query = {};
  if (options.byId) {
    query.byId = 'true';
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
  if (options.byId) {
    query.byId = 'true';
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