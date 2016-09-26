// third-party dependencies
const should   = require('should');
const slug     = require('slug');
const Bluebird = require('bluebird');
const jwt      = require('jsonwebtoken');

// auxiliary
const aux = require('../../aux');

const PrivateHProject = require('../../../client/private');
const hProject = require('../../../server');

describe('PrivateHProject', function () {

  var ASSETS;
  var H_PROJECT_TOKEN = jwt.sign({
    sub: 'test-private-client',
  }, aux.defaultOptions.privateAPISecret);

  beforeEach(function () {

    // rabbit mq takes 10000 ms to timeout connection by default
    this.timeout(11000);

    return aux.setup()
      .then((assets) => {

        ASSETS = assets;

        var options = aux.clone(aux.defaultOptions);

        ASSETS.hProject = hProject(options);

        return ASSETS.hProject.ready;

      })
      .then(() => {

        var user1Projects = ['Project 1', 'Project 2', 'Project 3'].map((name) => {
          return ASSETS.hProject.controllers.project.create('user-id-1', {
            name: name,
          });
        });

        var user2Projects = ['Project 4', 'Project 5', 'Project 6', 'Project 7'].map((name) => {
          return ASSETS.hProject.controllers.project.create('user-id-2', {
            name: name,
          });
        });

        // create some projects
        return Bluebird.all(user1Projects.concat(user2Projects));

      }).then((projects) => {

        ASSETS.projects = projects;

        return aux.startServer(8000, ASSETS.hProject);
      });
  });

  afterEach(function () {
    this.timeout(4000);
    return aux.teardown();
  });

  describe('#verifyProjectPermissions(authToken, subject, projectId, permissions)', function () {

    it('should verify if the given `subject` has the requested `permissions` for the project identified by `projectId`', function () {

      var client = new PrivateHProject({
        serverURI: 'http://localhost:8000'
      });

      return client.verifyProjectPermissions(
        H_PROJECT_TOKEN,
        'user-id-1',
        ASSETS.projects[0]._id.toString(),
        ['read']
      )
      .then((data) => {
        data.allowed.should.eql(true);
      });

    });

    it('should reject if permissions are not given', function () {

      var client = new PrivateHProject({
        serverURI: 'http://localhost:8000'
      });

      return client.verifyProjectPermissions(
        H_PROJECT_TOKEN,
        'user-id-1',
        ASSETS.projects[0]._id.toString(),
        ['some-permission']
      )
      .then((data) => {
        data.allowed.should.eql(false);
      });
    });
  });
});
