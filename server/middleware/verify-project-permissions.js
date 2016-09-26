// constants
const BEARER_TOKEN_RE = /^Bearer\s+(.+)/;

function _evaluateOpt(opt, req) {
  return (typeof opt === 'function') ? opt(req) : opt;
};

// exports a function that takes the app and some options and
// returns the middleware
module.exports = function (app, options) {

  const errors = app.errors;

  options = options || {};

  /**
   * Function that retrieves the 'sub' property of the auth tokenData.
   * Defaults to a function that gets the sub property from the request's
   * `tokenData.sub`, which is set by `authenticate` middleware.
   * 
   * @param  {Express Request} req
   * @return {String}
   */
  var _sub = options.sub || function (req) {
    return req.tokenData.sub;
  };

  /**
   * Function that retrieves the project object from the request object
   * Defaults to getting the project from the requests's 
   * `project` property
   * 
   * @param  {Express Request} req
   * @return {String}
   */
  var _project = options.project || function (req) {
    return req.project;
  };

  /**
   * Permissions to be verified
   * @type {Array}
   */
  const _permissions = options.permissions;

  return function verifyProjectPermissions(req, res, next) {

    var sub         = _evaluateOpt(_sub, req);
    var project     = _evaluateOpt(_project, req);
    var permissions = _evaluateOpt(_permissions, req);

    if (!permissions || permissions.length === 0) {
      next(new Error('permissions must be set'));
      return;
    }

    if (project.verifyPermissions(sub, permissions)) {
      next();
    } else {
      next(new errors.Unauthorized());
    }
  };
};