// native
const fs = require('fs');

// third-party dependencies
const should   = require('should');
const slug     = require('slug');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../aux');

const hProjectServer = require('../../../server');

describe('projectVersionCtrl.restore(project, versionCode)', function () {

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
        );
      })
      .then((v1) => {
        ASSETS.v1 = v1;

        return ASSETS.hProject.controllers.projectVersion.create(
          ASSETS.projects[0],
          fs.createReadStream(aux.fixturesPath + '/another-website.zip')
        );
      })
      .then((v2) => {
        ASSETS.v2 = v2;
      })
      .catch(aux.logError);
  });

  afterEach(function () {
    return aux.teardown();
  });

  it('should create a new version that has the same source files as the version corresponding to the given versionCode', function () {

    this.timeout(10000);

    return ASSETS.hProject.controllers.projectVersion
      .restore(ASSETS.projects[0], ASSETS.v1.code)
      .then((latestVersion) => {
        latestVersion.number.should.eql(3);
        latestVersion.code.should.eql('v3');

        (latestVersion.srcStorage.generation > ASSETS.v2.srcStorage.generation)
          .should.eql(true);
      });
  });

  it('should error when given an inexistent versionCode', function () {

    return ASSETS.hProject.controllers.projectVersion
      .restore(ASSETS.projects[0], 'v9')
      .then(aux.errorExpected, (err) => {

        err.name.should.eql('NotFound');

      });
  });
});
