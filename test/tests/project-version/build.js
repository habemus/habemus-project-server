// native
const fs = require('fs');

// third-party dependencies
const should   = require('should');
const slug     = require('slug');
const Bluebird = require('bluebird');
const request  = require('request');
const mime     = require('mime');

// auxiliary
const aux = require('../../aux');

const hProjectServer = require('../../../server');

describe('projectVersionCtrl - build', function () {

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

  describe('#scheduleBuild(version)', function () {
    it('should schedule a build for the version', function () {

      return ASSETS.hProject.controllers.projectVersion
        .scheduleBuild(ASSETS.projectVersion)
        .then((version) => {

          version.buildRequestId.should.be.instanceof(String);
          version.getBuildStatus().should.eql('scheduled');

        });

    });
  });

  describe('#handleBuildSuccess(buildRequestId, payload)', function () {
    it('should update the distStorage details', function () {

      this.timeout(10000);

      var _buildRequestId;

      return ASSETS.hProject.controllers.projectVersion
        .scheduleBuild(ASSETS.projectVersion)
        .then((version) => {

          _buildRequestId = version.buildRequestId;

          return ASSETS.hProject.controllers.projectVersion
            .getDistSignedURL(version, 'write');

        })
        .then((distSignedURL) => {

          return new Bluebird((resolve, reject) => {

            // write a file to the distSignedURL to emulate a build success
            var readStream = fs.createReadStream(aux.fixturesPath + '/website.zip');

            var writeStream = request.put({
              url: distSignedURL,
              headers: {
                'Content-Type': mime.lookup('website.zip'),
              },
            });

            readStream.pipe(writeStream);

            writeStream.on('response', resolve);

            writeStream.on('error', reject);
          })

        })
        .then((writeResponse) => {

          return ASSETS.hProject.controllers.projectVersion
            .handleBuildSuccess(_buildRequestId);
        })
        .then((version) => {

          version.distStorage.generation.should.be.instanceof(String);
          version.getBuildStatus().should.eql('succeeded');
          should(version.get('buildRequestId')).eql(undefined);

        });

    });
  });

  describe('#handleBuildFailure(buildRequestId)', function () {
    it('should update the buildStatus to failed', function () {

      var _buildRequestId;

      return ASSETS.hProject.controllers.projectVersion
        .scheduleBuild(ASSETS.projectVersion)
        .then((version) => {

          _buildRequestId = version.buildRequestId;

          return ASSETS.hProject.controllers.projectVersion
            .handleBuildFailure(_buildRequestId);
        })
        .then((version) => {

          version.getBuildStatus().should.eql('failed');
          should(version.distStorage.generation).eql(undefined);
          should(version.get('buildRequestId')).eql(undefined);

        });
    });
  });
});
