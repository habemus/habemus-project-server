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

describe('projectVersionCtrl#delete(version)', function () {

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

        var _buildRequestId;

        // make the build process succeed
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
          });
      })
      .then((projectVersion) => {
        // save the new projectVersion (this one has the whole build process in it)
        ASSETS.projectVersion = projectVersion;
      })
      .catch(aux.logError);
  });

  afterEach(function () {
    return aux.teardown();
  });

  it('should delete srcStorage, distStorage and the version itself', function () {

    this.timeout(10000);

    var srcStorageId  = ASSETS.projectVersion.srcStorage._id;
    var distStorageId = ASSETS.projectVersion.distStorage._id;

    return ASSETS.hProject.controllers.projectVersion
      .delete(ASSETS.projectVersion)
      .then(() => {
        // check that srcStorage and distStorage files were
        // removed from gcs

        var gcsSrcFile  = ASSETS.hProject.services.gcs.file(srcStorageId);
        var gcsDistFile = ASSETS.hProject.services.gcs.file(distStorageId);

        return Bluebird.all([
          new Bluebird((resolve, reject) => {
            gcsSrcFile.getMetadata((err, metadata) => {
              if (err) {
                err.code.should.eql(404);
                resolve();
              } else {
                reject(new Error('error expected'));
              }
            })
          }),

          new Bluebird((resolve, reject) => {
            gcsDistFile.getMetadata((err, metadata) => {
              if (err) {
                err.code.should.eql(404);
                resolve();
              } else {
                reject(new Error('error expected'));
              }
            })
          }),
        ]);

      });

  });
});
