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
  var projectVersionCtrl;

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

        projectVersionCtrl = ASSETS.hProject.controllers.projectVersion;

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

      return projectVersionCtrl.getSrcSignedURL(
        ASSETS.projectVersion,
        'read'
      )
      .then((url) => {
        url.should.be.instanceof(String);
      });

    });

    it('should require a valid version as the first argument', function () {

      return projectVersionCtrl.getSrcSignedURL(
        undefined,
        'read'
      )
      .then(aux.errorExpected, (err) => {
        err.name.should.eql('InvalidOption');
        err.option.should.eql('version');
      });

    });
  });

  describe('#getDistSignedURL(version, action, expiresIn)', function () {
    it('should generate a signed url of the distStorage for write action', function () {
      return projectVersionCtrl.getDistSignedURL(
        ASSETS.projectVersion,
        'write'
      )
      .then((url) => {
        url.should.be.instanceof(String);
      });
    });

    it('should require a valid version as the first argument', function () {

      return projectVersionCtrl.getDistSignedURL(
        undefined,
        'read'
      )
      .then(aux.errorExpected, (err) => {
        err.name.should.eql('InvalidOption');
        err.option.should.eql('version');
      });

    });
  });

  describe('#getSignedURLs(version, urlOptions)', function () {
    it('should generate the urls requested in urlOptions', function () {
      return projectVersionCtrl.getSignedURLs(
        ASSETS.projectVersion,
        {
          src: {
            action: 'read',
            expiresIn: '10d',
            promptSaveAs: 'my-file.txt',
          },
          dist: {
            action: 'read',
            expiresIn: '20d',
            promptSaveAs: 'another-file.zip',
          }
        }
      )
      .then((signedURLs) => {
        signedURLs.src.should.be.instanceof(String);
        signedURLs.dist.should.be.instanceof(String);
      })
    });
  });

  describe('#getByProjectAndCode(project, code)', function () {
    it('should retrieve a projectVersion by the project and the versionCode', function () {
      return projectVersionCtrl.getByProjectAndCode(
        ASSETS.projects[0],
        ASSETS.projectVersion.code
      )
      .then((projectVersion) => {
        projectVersion.projectId.should.eql(ASSETS.projects[0]._id);
        projectVersion.code.should.eql(ASSETS.projectVersion.code);
      });
    });
  });

  describe('#getProjectLatest(project)', function () {
    it('should retrieve the latest projectVersion of the given project', function () {
      return projectVersionCtrl.getProjectLatest(ASSETS.projects[0])
        .then((projectVersion) => {
          projectVersion._id.should.eql(ASSETS.projectVersion._id);
        });
    });
  });
});
