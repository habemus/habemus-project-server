// third-party
const bodyParser = require('body-parser');
const Bluebird   = require('bluebird');

const VERSION_DATA = {
  _id: true,
  createdAt: true,
  code: true,
  number: true,
  author: true,
  srcSignedURL: true,
  distSignedURL: true,
};

module.exports = function (app, options) {

  const errors = app.errors;

  const projectVersionCtrl = app.controllers.projectVersion;

  app.post('/project/:identifier/versions',
    app.middleware.authenticate(options),
    app.middleware.loadProject(),
    app.middleware.verifyProjectPermissions({
      permissions: [
        'update'
      ]
    }),
    app.middleware.uploadProjectVersion({
      maxProjectFileSize: options.maxProjectFileSize,
    }),
    function (req, res) {

      var projectVersion = req.projectVersion;

      var msg = app.services.messageAPI.item(
        projectVersion,
        VERSION_DATA
      );
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

      return projectVersionCtrl.listByProject(project)
        .then((versions) => {

          var msg = app.services.messageAPI.list(versions, VERSION_DATA);
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

      var distSignedURL = req.query.distSignedURL;
      var srcSignedURL  = req.query.srcSignedURL;

      var _version;

      return projectVersionCtrl.getByProjectAndCode(project, versionCode)
        .then((version) => {
          _version = version;

          var srcSignedURLPromise = (typeof srcSignedURL === 'string') ?
            projectVersionCtrl.getSrcSignedURL(
              version,
              'read',
              '15min',
              version.code + '.' + project.code + '-src.zip'
            ) :
            undefined;

          var distSignedURLPromise = (typeof distSignedURL === 'string') ?
            projectVersionCtrl.getDistSignedURL(
              version,
              'read',
              '15min',
              version.code + '.' + project.code + '-dist.zip'
            ) :
            undefined;

          return Bluebird.all([
            srcSignedURLPromise,
            distSignedURLPromise
          ]);
        })
        .then((signedURLs) => {

          var versionData = _version.toJSON();

          versionData.srcSignedURL  = signedURLs[0];
          versionData.distSignedURL = signedURLs[1];

          var msg = app.services.messageAPI.item(versionData, VERSION_DATA);

          res.status(200).json(msg);
        })
        .catch(next);
    }
  );
};