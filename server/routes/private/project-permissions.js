module.exports = function (app, options) {

  const errors = app.errors;

  app.get('/project/:identifier/verify-permissions',
    app.middleware.authenticate(options),
    app.middleware.loadProject(),
    function (req, res, next) {
      var sub = req.tokenData.sub;

      var scopes = req.query.scopes;

      if (!scopes) {
        next(new errors.InvalidOption('scopes', 'required', 'scopes are required for verification'));
        return;
      }

      var allowed = req.project.verifyPermissions(sub, scopes);
      
      if (allowed) {
        // no message, only success status code
        res.status(204).end();
      } else {
        next(new errors.Unauthorized());
        return;
      }
    }
  );
};