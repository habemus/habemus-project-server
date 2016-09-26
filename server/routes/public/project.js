// third-party
const bodyParser = require('body-parser');
const Bluebird   = require('bluebird');

const PROJECT_DATA = {
  _id: true,
  name: true,
  code: true,
  createdAt: true,
  updatedAt: true,
}

module.exports = function (app, options) {

  const errors = app.errors;

  const projectCtrl = app.controllers.project;

  app.post('/projects',
    app.middleware.authenticate(options),
    bodyParser.json(),
    function (req, res, next) {

      var sub = req.tokenData.sub;

      projectCtrl.create(sub, req.body)
        .then(function (createdProject) {

          var msg = app.format.item(createdProject, PROJECT_DATA);

          res.status(201).json(msg);
        })
        .catch(next);
    }
  );

  app.get('/projects',
    app.middleware.authenticate(options),
    function (req, res, next) {
      var sub = req.tokenData.sub;

      // list projects owned by the user
      app.controllers.project.listUserProjects(sub)
        .then((projects) => {
          var msg = app.format.list(projects, PROJECT_DATA);

          res.json(msg);
        })
        .catch(next);
    }
  );

  app.get('/projects/is-code-available',
    app.middleware.authenticate(options),
    function (req, res, next) {
      var code = req.query.code;

      app.controllers.project.getByCode(code)
        .then((project) => {

          var error = new errors.InUse('code', code);

          next(error);
          return;

        })
        .catch((err) => {
          if (err instanceof errors.NotFound) {

            // project with the requested code does not exist
            // simply signal OK
            res.status(204).end();

          } else {
            // unknown error happened, let it be handled by the application
            return Bluebird.reject(err);
          }
        });
    }
  );

  app.get('/project/:identifier',
    app.middleware.authenticate(options),
    app.middleware.loadProject(),
    app.middleware.verifyProjectPermissions({
      permissions: ['read']
    }),
    function (req, res, next) {

      var msg = app.format.item(req.project, PROJECT_DATA);
      res.json(msg);

    }
  );
  
  app.delete('/project/:identifier',
    app.middleware.authenticate(options),
    app.middleware.loadProject(),
    app.middleware.verifyProjectPermissions({
      permissions: ['delete']
    }),
    function (req, res, next) {
      var sub = req.tokenData.sub;

      app.controllers.project.scheduleRemoval(sub, req.project, 'UserRequest')
        .then(() => {
          res.status(204).end();
        })
        .catch(next);
    }
  );

  app.put('/project/:identifier',
    app.middleware.authenticate(options),
    app.middleware.loadProject(),
    app.middleware.verifyProjectPermissions({
      permissions: ['update']
    }),
    bodyParser.json(),
    function (req, res, next) {
      var sub = req.tokenData.sub;

      app.controllers.project.update(sub, req.project, req.body)
        .then((project) => {
          var msg = app.format.item(project, PROJECT_DATA);

          res.json(msg);
        })
        .catch(next);
    }
  );

  app.put('/project/:identifier/code',
    app.middleware.authenticate(options),
    app.middleware.loadProject(),
    app.middleware.verifyProjectPermissions({
      permissions: ['update']
    }),
    bodyParser.json(),
    function (req, res, next) {
      var sub = req.tokenData.sub;

      app.controllers.project.updateCode(sub, req.project, req.body.code)
        .then((project) => {
          var msg = app.format.item(project, PROJECT_DATA);

          res.json(msg);
        })
        .catch(next);
    }
  );
};
