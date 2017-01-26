// native dependencies
const http = require('http');
const path = require('path');

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
  if (!options.rabbitMQURI) { throw new Error('rabbitMQURI is required'); }
  if (!options.websiteRabbitMQURI) { throw new Error('websiteRabbitMQURI is required'); }
  if (!options.hAccountURI) { throw new Error('hAccountURI is required'); }
  if (!options.hAccountToken) { throw new Error('hAccountToken is required'); }

  if (!options.gcpProjectId) { throw new Error('gcpProjectId is required'); }
  if (!options.gcpBucket) { throw new Error('gcpBucket is required'); }

  /**
   * storage.file().getSignedUrl requires the keyFilename for the storage
   * otherwise it would not be needed when running infrastructure inside GCP
   */
  if (!options.gcpKeyFilename || path.extname(options.gcpKeyFilename) !== '.json') {
    throw new Error('gcpKeyFilename is required or is invalid - must be .json');
  }

  if (!options.maxProjectFileSize) { throw new Error('maxProjectFileSize is required'); }

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
    app.middleware.cors =
      require('./middleware/cors').bind(null, app);
    app.middleware.authenticate =
      require('./middleware/authenticate').bind(null, app);
    app.middleware.authenticatePrivate =
      require('./middleware/authenticate-private').bind(null, app);
    app.middleware.loadProject =
      require('./middleware/load-project').bind(null, app);
    app.middleware.uploadProjectVersion =
      require('./middleware/upload-project-version').bind(null, app);
    app.middleware.verifyProjectPermissions =
      require('./middleware/verify-project-permissions').bind(null, app);
    
    // define description route
    app.get('/who', function (req, res) {
      var msg = app.services.messageAPI.item({ name: 'h-project' }, { name: true });
      res.json(msg);
    });
  
    // load routes
    require('./routes/public')(app, options);

    if (options.enablePrivateAPI) {
      if (!options.privateAPISecret) {
        throw new Error('privateAPISecret is required for enablePrivateAPI = true');
      }
      
      require('./routes/private')(app, options);
    }
  
    // load error-handlers
    require('./error-handlers/h-project-error')(app, options);
    
    return app;
  });

  return app;
}

module.exports = hProject;