// native
const fs = require('fs');

// third-party dependencies
const should   = require('should');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../aux');

const hProjectServer = require('../../../server');

describe('projectVersionCtrl.create(project, source)', function () {

  var ASSETS;

  beforeEach(function () {

    this.timeout(30000);

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
          ASSETS.hProject.controllers.project.create('some-user-id', {
            name: 'Test Project 3'
          }),
          ASSETS.hProject.controllers.project.create('some-user-id', {
            name: 'Test Project 4'
          }),
        ]);
      })
      .then((projects) => {
        ASSETS.projects = projects;
      })
      .catch(aux.logError);
  });

  afterEach(function () {
    return aux.teardown();
  });

  it('should create a projectVersion using the given source readStream', function () {

    var projectId = ASSETS.projects[0]._id;

    this.timeout(30000);

    var _v1;
    var _v2;

    return ASSETS.hProject.controllers.projectVersion.create(
      ASSETS.projects[0],
      fs.createReadStream(aux.fixturesPath + '/website.zip')
    )
    .then((version1) => {

      _v1 = version1;

      version1.number.should.eql(1);
      version1.code.should.eql('v1');

      version1.projectId.should.eql(projectId);

      version1.srcStorage.provider.should.eql('GCS');
      version1.srcStorage._id.should.eql(projectId + '.zip');
      (typeof version1.srcStorage.generation).should.eql('string');

      version1.distStorage.provider.should.eql('GCS');
      version1.distStorage._id.should.eql(projectId + '-dist.zip');
      should(version1.distStorage.generation).eql(undefined);

      version1.getBuildStatus().should.eql('not-scheduled');

      // create a second version of the same project
      return ASSETS.hProject.controllers.projectVersion.create(
        ASSETS.projects[0],
        fs.createReadStream(aux.fixturesPath + '/another-website.zip')
      )
    })
    .then((version2) => {

      _v2 = version2;

      version2.number.should.eql(2);
      version2.code.should.eql('v2');

      version2.projectId.should.eql(projectId);

      version2.srcStorage.provider.should.eql('GCS');
      version2.srcStorage._id.should.eql(projectId + '.zip');
      (typeof version2.srcStorage.generation).should.eql('string');

      version2.getBuildStatus().should.eql('not-scheduled');

      // check that the generation is different
      version2.srcStorage.generation.should.not.equal(_v1.srcStorage.generation);

      var gen1 = parseInt(_v1.srcStorage.generation, 10);
      var gen2 = parseInt(version2.srcStorage.generation, 10);

      (gen2 > gen1).should.equal(true);

      // but that the _id is the same
      version2.srcStorage._id.should.equal(_v1.srcStorage._id);

    })
    .catch(aux.logError);

  });

  it('should require the first argument to be instance of the `Project` model', function () {
    return ASSETS.hProject.controllers.projectVersion.create(
      undefined,
      fs.createReadStream(aux.fixturesPath + '/website.zip')
    )
    .then(aux.errorExpected, (err) => {
      err.name.should.eql('InvalidOption');
      err.option.should.eql('project');
    });
  });

  it('should require the source to be passed as the second argument', function () {
    return ASSETS.hProject.controllers.projectVersion.create(
      ASSETS.projects[0],
      undefined
    )
    .then(aux.errorExpected, (err) => {
      err.name.should.eql('InvalidOption');
      err.option.should.eql('source');
    });
  });

  it('in case the source is a string, it should treat it as an url from which to download the zip file', function () {

    this.timeout(10000);

    return ASSETS.hProject.controllers.projectVersion.create(
      ASSETS.projects[0],
      ASSETS.fileAppURI + '/files/website.zip'
    )
    .then((version1) => {
      version1.number.should.eql(1);
      version1.code.should.eql('v1');
    });
  });

  it('should ensure uniqueness of the version code for a given projectId', function () {

    this.timeout(10000);

    var ProjectVersion = ASSETS.hProject.services.mongoose.models.ProjectVersion;

    var v1 = new ProjectVersion({
      projectId: ASSETS.projects[0]._id,
      code: 'v1',
    });

    v1.setBuildStatus('scheduled', 'TestReason');
    v1.setDeployStatus('scheduled', 'TestReason');

    return v1.save().then((version1) => {

      version1.code.should.eql('v1');

      var v1Again = new ProjectVersion({
        projectId: ASSETS.projects[0]._id,
        code: 'v1',
      });

      v1Again.setBuildStatus('scheduled', 'TestReason');
      v1Again.setDeployStatus('scheduled', 'TestReason');

      return v1Again.save();
    })
    .then(aux.errorExpected, (err) => {

      // mongodb duplicate key error code
      err.code.should.eql(11000);
    });
  });

  it('should schedule the build if `scheduleBuild` option is passed', function () {

    this.timeout(10000);
    
    return ASSETS.hProject.controllers.projectVersion.create(
      ASSETS.projects[0],
      fs.createReadStream(aux.fixturesPath + '/website.zip'),
      {
        scheduleBuild: true
      }
    )
    .then((version) => {
      version.getBuildStatus().should.eql('scheduled');
    });
  });
});
