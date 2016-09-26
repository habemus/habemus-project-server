module.exports = function (app, options) {

  const errors = app.errors;

  app.get('/_/project/:identifier/verify-permissions',
    app.middleware.loadProject(),
    function (req, res, next) {
      var subject = req.query.subject;

      var permissions = req.query.permissions;

      if (!permissions) {
        next(new errors.InvalidOption('permissions', 'required', 'permissions are required for verification'));
        return;
      }

      // ensure permissions come in array format
      permissions = Array.isArray(permissions) ? permissions : [permissions];

      var allowed;

      try {
        allowed = req.project.verifyPermissions(subject, permissions);
      } catch (err) {
        allowed = false;
      }

      var msg = app.services.messageAPI.item({
        allowed: allowed,
      }, {
        allowed: true,
      });

      res.json(msg);
    }
  );
};