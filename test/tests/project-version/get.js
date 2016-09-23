// native
const fs = require('fs');

// third-party dependencies
const should   = require('should');
const slug     = require('slug');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../aux');

const hProjectServer = require('../../../server');

describe('projectVersionCtrl - get methods', function () {

  var ASSETS;

  beforeEach(function () {

    this.timeout(10000);

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

  describe('#listByProject(project)', function () {
    it('should list all versions related to the given project', function () {

      return ASSETS.hProject.controllers.projectVersion
        .listByProject(ASSETS.projects[0])
        .then((versions) => {
          versions.length.should.eql(2);
        });

    });
  });
});
