// third-party
const bodyParser = require('body-parser');

const VERSION_DATA = {
  _id: true,
  createdAt: true,
  author: true,
  detail: true,
};

module.exports = function (app, options) {

  const errors = app.errors;

  const projectCtrl = app.controllers.project;

  app.post('/project/:identifier/versions',
    app.middleware.authenticate(),
    app.middleware.loadProject(),
    app.middleware.verifyProjectPermissions({
      permissions: [
        'update'
      ]
    }),
    app.middleware.uploadProjectVersion({
      maxWebsiteFileSize: options.maxWebsiteFileSize,
    }),
    function (req, res) {

      var website = req.website;

      var msg = app.services.messageAPI.item(website, WEBSITE_DATA);
      res.json(msg);
    }
  );

  app.get('/project/:identifier/versions',
    app.middleware.authenticate(options),
    app.middleware.loadProject(),
    app.middleware.verifyProjectPermissions({
      permissions: ['read']
    }),
    function (req, res, next) {

      var project = req.project;

      return projectCtrl.listVersions(project)
        .then((versions) => {

          var msg = app.format.list(versions, VERSION_DATA);
          res.status(200).json(msg);

        })
        .catch(next);
    }
  );

  /**
   * Retrieve data about a specific version
   */
  app.get('/project/:projectIdentifier/version/:versionCode',
    app.middleware.authenticate(options),
    app.middleware.loadProject({
      identifier: function (req) {
        return req.params.projectIdentifier;
      }
    }),
    app.middleware.verifyProjectPermissions({
      permissions: ['read']
    }),
    function (req, res, next) {
      var project     = req.project;
      var versionCode = req.params.versionCode;

      return projectCtrl.getSignedUrl(project, versionCode)
        .then((url) => {
          var msg = app.format.item({ url: url }, { url: true });
          res.status(200).json(msg);
        })
        .catch(next);
    }
  );
};