module.exports = function (app, options) {

  /**
   * Authenticate all private routes
   */
  app.use('/_', app.middleware.authenticatePrivate(options));

  require('./project-permission')(app, options);
  require('./project-version')(app, options);
  require('./project')(app, options);
};