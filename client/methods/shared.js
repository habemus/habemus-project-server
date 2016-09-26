/**
 * Retrieves a project by its `_id` attribute.
 * 
 * @param  {String} authToken
 * @param  {String} projectId
 * @return {Bluebird -> Project}
 */
exports.getById = function (authToken, projectId) {

  return this._authReq('GET', '/project/' + projectId, {
    token: authToken
  });
};

/**
 * Retrieves a project by its `code` attribute.
 * @param  {String} authToken
 * @param  {String} projectCode
 * @return {Bluebird -> Project}
 */
exports.getByCode = function (authToken, projectCode) {
  
};

/**
 * Retrieves a list of all versions related to the given project
 * 
 * @param  {String} authToken
 * @param  {String} projectId
 * @return {Bluebird -> Array[ProjectVersion]}
 */
exports.listProjectVersions = function (authToken, projectId) {

};

/**
 * Retrieves a projectVersion by the combination of projectId and versionCode
 *
 * Optionally retrieves signed urls with the requested actions (for the moment
 * only `read` is allowed)
 *
 * If versionCode is `null` will retrieve the latest version of the project.
 * 
 * @param  {String} authToken
 * @param  {String} projectId
 * @param  {String|Null} versionCode
 * @param  {Object} options
 *         - srcSignedURL: String
 *         - distSignedURL: String
 * @return {Bluebird -> projectVersion}            
 */
exports.getProjectVersion = function (authToken, projectId, versionCode, options) {

  options = options || {};

};
