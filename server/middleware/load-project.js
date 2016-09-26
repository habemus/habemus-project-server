// auxiliary
const aux = require('./auxiliary');

// exports a function that takes the app and some options and
// returns the middleware
module.exports = function (app, options) {

  const errors = app.errors;

  options = options || {};

  /**
   * Function that retrieves the project's identifier
   * Defaults to getting the identifier from the requests's 
   * `params.identifier` property
   * 
   * @param  {Express Request} req
   * @return {String}
   */
  var _identifier = options.identifier || function (req) {
    return req.params.identifier;
  };

  /**
   * Function or value that represents which identifier property
   * the identifier parameter refers to.
   * There are three options: 
   *   - _id
   *   - activeDomain
   *   - code
   * 
   * @param  {express req} req
   * @return {String}
   */
  var _identifierProp = options.identifierProp || function (req) {

    var query = req.query;

    if (query.byCode !== undefined) {
      return 'code';
    } else {
      // by default use _id as identifier prop
      return '_id';
    }
  }

  /**
   * Name of the property to be set onto the req object
   * to store the resulting project.
   * @type {String}
   */
  var _as = options.as || 'project';

  return function loadProject(req, res, next) {

    var identifier     = aux.evalOpt(_identifier, req);
    var identifierProp = aux.evalOpt(_identifierProp, req);
    var as             = aux.evalOpt(_as, req);

    switch (identifierProp) {
      case '_id':

        app.controllers.project.getById(identifier)
          .then((project) => {
            req[as] = project;

            next();
          })
          .catch(next);

        break;
      case 'code':

        app.controllers.project.getByCode(identifier)
          .then((project) => {
            req[as] = project;

            next();
          })
          .catch(next);

        break;
      default:
        next(new Error('unsupported identifierProp ' + identifierProp));
        break;
    }
  };
};
