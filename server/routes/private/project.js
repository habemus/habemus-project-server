// thrid-party
const Bluebird = require('bluebird');

// own
const interfaces = require('../interfaces');

module.exports = function (app, options) {

  const errors = app.errors;

  app.get('/project/:identifier',
    app.middleware.loadProject(),
    function (req, res, next) {

      var msg = app.services.messageAPI.item(req.project, interfaces.PROJECT_DATA);
      res.json(msg);

    }
  );
};