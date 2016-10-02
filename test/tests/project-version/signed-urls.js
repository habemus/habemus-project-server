// native
const fs = require('fs');

// third-party dependencies
const should   = require('should');
const slug     = require('slug');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../aux');

const hProjectServer = require('../../../server');

describe('projectVersionCtrl - signedURL methods', function () {

  var ASSETS;

  beforeEach(function () {

    this.timeout(20000);

    return aux.setup()
      .then((assets) => {

        ASSETS = assets;

        var options = aux.clone(aux.defaultOptions);

        ASSETS.hProject = hProjectServer(options);

        return ASSETS.hProject.ready;

      })
      .then(() => {
        return Bluebird.all([
          ASSETS.hProject.controllers.project.create('some-user-id', {
            name: 'Test Project 1'
          }),
          ASSETS.hProject.controllers.project.create('some-user-id', {
            name: 'Test Project 2'
          }),
        ]);
      })
      .then((projects) => {
        ASSETS.projects = projects;

        return ASSETS.hProject.controllers.projectVersion.create(
          ASSETS.projects[0],
          fs.createReadStream(aux.fixturesPath + '/website.zip')
        )
      })
      .then((projectVersion) => {
        ASSETS.projectVersion = projectVersion;
      })
      .catch(aux.logError);
  });

  afterEach(function () {
    return aux.teardown();
  });

  describe('#getSrcSignedURL(version, action, expiresIn)', function () {
    it('should generate a signed url of the srcStorage for read action', function () {

      return ASSETS.hProject.controllers.projectVersion.getSrcSignedURL(
        ASSETS.projectVersion,
        'read'
      )
      .then((url) => {
        url.should.be.instanceof(String);
      });

    });
  });

  describe('#getDistSignedURL(version, action, expiresIn)', function () {
    it('should generate a signed url of the distStorage for write action', function () {
      return ASSETS.hProject.controllers.projectVersion.getDistSignedURL(
        ASSETS.projectVersion,
        'write'
      )
      .then((url) => {
        url.should.be.instanceof(String);
      });
    });
  });
});
