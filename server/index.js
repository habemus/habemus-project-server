// native dependencies
const http = require('http');

// external dependencies
const express  = require('express');

// own dependencies
const setupServices = require('./services');

/**
 * Function that starts the host server
 */
function hProject(options) {
  if (!options.apiVersion) { throw new Error('apiVersion is required'); }
  if (!options.mongodbURI) { throw new Error('mongodbURI is required'); }

  if (!options.gcpProjectId) { throw new Error('gcpProjectId is required'); }
  if (!options.gcpBucket) { throw new Error('gcpBucket is required'); }

  /**
   * storage.file().getSignedUrl requires the keyFilename for the storage
   * otherwise it would not be needed when running infrastructure inside GCP
   */
  if (!options.gcpKeyFilename) { throw new Error('gcpKeyFilename is required'); }

  if (!options.maxFullProjectFileSize) { throw new Error('maxFullProjectFileSize is required'); }
  
  if (!options.authTokenDecodeURI) { throw new Error('authTokenDecodeURI is required'); }


  // create express app instance
  var app = express();

  // make constants available throughout the application
  app.constants = require('../shared/constants');

  // make the error constructors available throughout the application
  app.errors = require('../shared/errors');
  
  app.ready = setupServices(app, options).then(() => {
    
    // instantiate controllers
    app.controllers = {};
    app.controllers.project =
      require('./controllers/project')(app, options);
    app.controllers.projectVersion =
      require('./controllers/project-version')(app, options);
  
    // instantiate middleware for usage in routes
    app.middleware = {};
    // app.middleware.authenticate =
    //   require('./middleware/authenticate').bind(null, app);
    // app.middleware.loadProject =
    //   require('./middleware/load-project').bind(null, app);
    // app.middleware.verifyProjectPermissions =
    //   require('./middleware/verify-project-permissions').bind(null, app);
    
    // define description route
    app.get('/who', function (req, res) {
      var msg = app.format.item({ name: 'h-project-manager' }, { name: true });
      res.json(msg);
    });
  
    // load routes
    // require('./routes/project')(app, options);
    // require('./routes/permissions')(app, options);
  
    // load error-handlers
    // require('./error-handlers/h-project-manager-error')(app, options);
    
    return app;
  });

  return app;
}

module.exports = hProject;