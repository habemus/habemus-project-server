exports.getById = function (authToken, projectId) {

};

exports.getByCode = function (authToken, projectCode) {

};

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

};
