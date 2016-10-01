module.exports = function (app, options) {

  var _cors = app.middleware.cors({
    corsWhitelist: options.corsWhitelist
  });
  app.options('*', _cors);
  app.use(_cors);

  require('./project')(app, options);
  require('./project-version')(app, options);
};
