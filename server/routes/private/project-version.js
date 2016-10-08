// thrid-party
const Bluebird = require('bluebird');

// own
const interfaces = require('../interfaces');

module.exports = function (app, options) {

  const errors = app.errors;

  const projectVersionCtrl = app.controllers.projectVersion;

  app.get('/project/:projectIdentifier/versions/latest',
    app.middleware.loadProject({
      identifier: function (req) {
        return req.params.projectIdentifier;
      }
    }),
    function (req, res, next) {
      var project     = req.project;

      var distSignedURL = req.query.distSignedURL;
      var srcSignedURL  = req.query.srcSignedURL;

      var _version;

      return projectVersionCtrl.getProjectLatest(project)
        .then((version) => {
          _version = version;

          var URLOpts = {};

          if (typeof srcSignedURL === 'string') {
            URLOpts.src = {
              action: 'read',
              expiresIn: '15min'
            };
          }

          if (typeof distSignedURL === 'string') {
            URLOpts.dist = {
              action: 'read',
              expiresIn: '15min',
            };
          }

          return projectVersionCtrl.getSignedURLs(version, URLOpts);
        })
        .then((signedURLs) => {

          var versionData = _version.toJSON();

          versionData.srcSignedURL  = signedURLs.src;
          versionData.distSignedURL = signedURLs.dist;

          var msg = app.services.messageAPI.item(versionData, interfaces.VERSION_DATA);

          res.status(200).json(msg);
        })
        .catch(next);
    }
  );

  /**
   * Retrieve data about a specific version
   */
  app.get('/project/:projectIdentifier/version/:versionCode',
    app.middleware.loadProject({
      identifier: function (req) {
        return req.params.projectIdentifier;
      }
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

          var msg = app.services.messageAPI.item(versionData, interfaces.VERSION_DATA);

          res.status(200).json(msg);
        })
        .catch(next);
    }
  );
};