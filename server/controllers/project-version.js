// native
const crypto = require('crypto');
const path   = require('path');

// third-party dependencies
const Bluebird = require('bluebird');
const request  = require('request');
const ms       = require('ms');
const mime     = require('mime');
const moment   = require('moment');

// constants
const SRC_SIGNED_URL_ACTIONS = ['read'];
const DIST_SIGNED_URL_ACTIONS = ['read', 'write'];

/**
 * Helper function that generates the gcs filename
 */
function _gcsFilename(fileType, project) {

  switch (fileType) {
    case 'src':
      return project._id + '.zip';
      break;
    case 'dist':
      // append -dist suffix
      return project._id + '-dist.zip';
      break;
    default:
      throw new Error('unsupported fileType: must be either `src` or `dist`');
      break;
  }
}

module.exports = function (app, options) {

  const DEFAULT_SIGNED_URL_EXPIRES_IN = options.defaultSignedURLExpiresIn || '3h';

  const errors = app.errors;
  
  const Project        = app.services.mongoose.models.Project;
  const ProjectVersion = app.services.mongoose.models.ProjectVersion;

  var projectVersionCtrl = {};

  /**
   * Writes a readStream to the storage
   * 
   * @param  {Project} project
   * @param  {ReadableStream} readStream
   * @return {Bluebird -> Project}
   */
  projectVersionCtrl.create = function (project, source, createOptions) {

    if (!(project instanceof Project) || !project._id) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required'));
    }

    if (!source) {
      return Bluebird.reject(new errors.InvalidOption('source', 'required'));
    }

    createOptions = createOptions || {};

    /**
     * Assume that if the source is a String, it is a url from which to
     * download the zip files.
     *
     * Otherwise assume it is a readable stream.
     * 
     * @type {ReadableStream}
     */
    var readStream = (typeof source === 'string') ? request(source) : source;

    // var gcsFilename    = project._id + '.zip';
    var gcsFilename    = _gcsFilename('src', project);
    var gcsFile        = app.services.gcs.file(gcsFilename);
    var gcsWriteStream = gcsFile.createWriteStream();

    var _checksum;
    var _version;

    return new Bluebird((resolve, reject) => {
      // create a hash of the file
      var hashAlg = 'md5';
      var hash = crypto.createHash(hashAlg);

      readStream.on('data', function (data) {
        hash.update(data);
      });

      readStream.pipe(gcsWriteStream);

      readStream.on('error', function (err) {
        app.services.log.error('create version read stream error', err);
        reject(new errors.UploadFailed());
      });

      gcsWriteStream.on('error', (err) => {
        app.services.log.error('upload gcsWriteStream error', err);
        reject(new errors.UploadFailed());
      });

      gcsWriteStream.on('finish', () => {
        app.services.log.info('upload finished');

        _checksum = {
          alg: hashAlg,
          hash: hash.digest('hex'),
        };

        resolve();
      });
    })
    .then(() => {

      _version = new ProjectVersion();

      _version.set('projectId', project._id);

      /**
       * Save data about the source storage
       * that is ready
       */
      _version.set('srcStorage', {
        _id: gcsFile.name,
        provider: 'GCS',
        generation: gcsFile.metadata.generation,
        meta: {
          checksum: _checksum,
        }
      });

      /**
       * Save data about the intended address of the distStorage
       */
      _version.set('distStorage', {
        // `-dist` suffix
        // _id: path.basename(gcsFile.name, '.zip') + '-dist.zip',
        _id: _gcsFilename('dist', project),
        provider: 'GCS',
      });

      /**
       * Mark the version's build status as not scheduled
       */
      _version.setBuildStatus(
        app.constants.BUILD_STATUSES.NOT_SCHEDULED,
        'NewlyCreated'
      );

      /**
       * Mark the version's deployment as not scheduled
       */
      _version.setDeployStatus(
        app.constants.DEPLOY_STATUSES.NOT_SCHEDULED,
        'NewlyCreated'
      );

      return _version.save();
    })
    .then((_version) => {

      // retrieve the immediate previous version
      // find the latest _version that was created before
      // the current _version
      return ProjectVersion.findOne(
        {
          projectId: _version.projectId,
          createdAt: {
            $lt: _version.createdAt
          }
        },
        null,
        {
          sort: {
            // descending by createdAt
            createdAt: -1
          }
        }
      );
    })
    .then((previousVersion) => {
      // after successful insert, name and number the version
      // this is done after insert as to ensure the version's position
      // before naming.
      
      var previousNo = 0;
      var currentNo;

      if (previousVersion && typeof previousVersion.number === 'number') {
        previousNo = previousVersion.number;
      }

      currentNo = previousNo + 1;

      _version.set('number', currentNo);
      _version.set('code', 'v' + currentNo);

      return _version.save();
    })
    .then((createdVersion) => {
      if (createOptions.scheduleBuild) {
        return projectVersionCtrl.scheduleBuild(createdVersion);
      } else {
        return createdVersion;
      }
    });
  };

  /**
   * Schedules a build for the given version.
   *
   * It is idempotent in case the version has a build scheduled
   * or has a started build.
   * 
   * @param  {ProjectVersion} version
   * @return {Bluebird -> ProjectVersion}
   */
  projectVersionCtrl.scheduleBuild = function (version) {

    if (!version) {
      return Bluebird.reject(new errors.InvalidOption('version', 'required'));
    }

    var currentBuildStatus = version.getBuildStatus();

    if (currentBuildStatus === app.constants.BUILD_STATUSES.SCHEDULED ||
        currentBuildStatus === app.constants.BUILD_STATUSES.STARTED) {
      return version;
    }

    // retrieve signed-urls for read and write
    return Bluebird.all([
      projectVersionCtrl.getSrcSignedURL(version, 'read'),
      projectVersionCtrl.getDistSignedURL(version, 'write')
    ])
    .then((urls) => {
      // attempt to schedule a build
      return app.services.hBuilderHTML5.schedule({
        src: urls[0],
        dest: {
          method: 'PUT',
          url: urls[1]
        }
      });
    })
    .then((buildRequestId) => {

      version.set('buildRequestId', buildRequestId);
      version.setBuildStatus(
        app.constants.BUILD_STATUSES.SCHEDULED,
        'ScheduleSuccesful'
      );

      return version.save();
    });
  };

  /**
   * Handles a buildSuccess
   * 
   * @param  {String} buildRequestId
   * @return {Bluebird -> ProjectVersion}
   */
  projectVersionCtrl.handleBuildSuccess = function (buildRequestId, report) {

    if (!buildRequestId) {
      return Bluebird.reject(new errors.InvalidOption('buildRequestId', 'required'));
    }

    var query = { buildRequestId: buildRequestId };

    ProjectVersion.scopeQueryByBuildStatuses(query, [
      app.constants.BUILD_STATUSES.SCHEDULED,
      app.constants.BUILD_STATUSES.STARTED,
    ]);

    var _version;

    return ProjectVersion.findOne(query)
      .then((version) => {
        if (!version) {
          return Bluebird.reject(new errors.NotFound());
        }

        _version = version;

        // get metadata about the distStorage's latest version
        // DO not pass any generation, as we want the latest generation
        var gcsDistFile = app.services.gcs.file(version.distStorage._id);

        return new Bluebird((resolve, reject) => {
          gcsDistFile.getMetadata((err, metadata) => {

            if (err) {
              reject(err);
            } else {
              resolve(metadata);
            }
          })
        });
      })
      .then((metadata) => {

        // save the generation info
        _version.set('distStorage.generation', metadata.generation);

        // update the build status to succeeded
        _version.setBuildStatus(
          app.constants.BUILD_STATUSES.SUCCEEDED,
          'BuildSucceeded',
          report
        );

        // clear buildRequestId
        _version.set('buildRequestId', undefined);

        return _version.save();
      })
      .then((version) => {

        // schedule a deploy
        return app.services.hWebsiteDeployer.schedule({
          type: 'version-update',
          projectId: version.projectId,
          detail: {}
        });

      })
      .then((deployRequestId) => {
        console.log('deploy requested: ', deployRequestId);
        return _version;
      });

  };

  /**
   * Handles a build failure
   * 
   * @param  {String} buildRequestId
   * @return {Bluebird -> ProjectVersion}
   */
  projectVersionCtrl.handleBuildFailure = function (buildRequestId, report) {

    if (!buildRequestId) {
      return Bluebird.reject(new errors.InvalidOption('buildRequestId', 'required'));
    }

    var query = { buildRequestId: buildRequestId };

    ProjectVersion.scopeQueryByBuildStatuses(query, [
      app.constants.BUILD_STATUSES.SCHEDULED,
      app.constants.BUILD_STATUSES.STARTED,
    ]);

    var _version;

    return ProjectVersion.findOne(query)
      .then((version) => {
        if (!version) {
          return Bluebird.reject(new errors.NotFound());
        }

        _version = version;

        // update the build status to failed
        _version.setBuildStatus(
          app.constants.BUILD_STATUSES.FAILED,
          'BuildFailed',
          report
        );

        // clear buildRequestId
        _version.set('buildRequestId', undefined);

        return _version.save();
      });
  };

  /**
   * Generates a signed url for the srcStorage of the given version.
   * Only allows read action at the moment
   * 
   * @param  {Website} website
   * @param  {String} action
   * @param  {Number|String} expiresIn
   * @return {Bluebird -> URL}
   */
  projectVersionCtrl.getSrcSignedURL = function (version, action, expiresIn, promptSaveAs) {

    if (!version || !version.srcStorage || !version.srcStorage._id) {
      return Bluebird.reject(new errors.InvalidOption('version', 'required'));
    }

    if (!action) {
      return Bluebird.reject(new errors.InvalidOption('action', 'required'));
    }

    if (SRC_SIGNED_URL_ACTIONS.indexOf(action) === -1) {
      return Bluebird.reject(new errors.InvalidOption('action', 'illegal'));
    }

    // calculate the expiry
    expiresIn = expiresIn || DEFAULT_SIGNED_URL_EXPIRES_IN;
    expiresIn = (typeof expiresIn === 'string') ? ms(expiresIn) : expiresIn;

    var expires = moment().add(expiresIn, 'ms');

    var file = app.services.gcs.file(version.srcStorage._id, {
      generation: version.srcStorage.generation
    });

    return new Bluebird((resolve, reject) => {

      var options = {
        action: action,
        expires: expires,
        // it seems that the browser does not deal well with contentType header
        // contentType: mime.lookup(version.srcStorage._id),
      };

      if (promptSaveAs) {
        options.promptSaveAs = promptSaveAs;
      }

      file.getSignedUrl(options, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve(url);
        }
      });
    });

  };

  /**
   * Generates a signed url for the distStorage of the given version.
   * Allows read and write actions at the moment
   * 
   * @param  {Website} website
   * @param  {String} action
   * @param  {Number|String} expiresIn
   * @return {Bluebird -> URL}
   */
  projectVersionCtrl.getDistSignedURL = function (version, action, expiresIn, promptSaveAs) {

    if (!version || !version.distStorage || !version.distStorage._id) {
      return Bluebird.reject(new errors.InvalidOption('version', 'required'));
    }

    if (!action) {
      return Bluebird.reject(new errors.InvalidOption('action', 'required'));
    }

    if (DIST_SIGNED_URL_ACTIONS.indexOf(action) === -1) {
      return Bluebird.reject(new errors.InvalidOption('action', 'illegal'));
    }

    // in case the buildStatus is at 'failed',
    // use the src storage as the dist.
    if (version.getBuildStatus() === 'failed') {
      return projectVersionCtrl.getSrcSignedURL(version, action, expiresIn, promptSaveAs);
    }

    // calculate the expiry
    expiresIn = expiresIn || DEFAULT_SIGNED_URL_EXPIRES_IN;
    expiresIn = (typeof expiresIn === 'string') ? ms(expiresIn) : expiresIn;

    var expires = moment().add(expiresIn, 'ms');

    var file = app.services.gcs.file(version.distStorage._id, {
      generation: version.distStorage.generation,
    });

    return new Bluebird((resolve, reject) => {

      var options = {
        action: action,
        expires: expires,
      };

      // for write actions, the mime type MUST be set
      if (action === 'write') {
        options.contentType = mime.lookup(version.srcStorage._id);
      }

      if (promptSaveAs) {
        options.promptSaveAs = promptSaveAs;
      }

      file.getSignedUrl(options, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve(url);
        }
      });
    });

  };

  /**
   * Helper function that optionally retrieves both signed urls.
   * 
   * @param  {ProjectVersion} version
   * @param  {Object} urlOptions
   *         - src:
   *           - action*: String
   *           - expiresIn*: String || Number
   *           - promptSaveAs: String
   *         - dist:
   *           - action*: String
   *           - expiresIn*: String || Number
   *           - promptSaveAs: String
   *          
   * @return {Bluebird -> Object}
   */
  projectVersionCtrl.getSignedURLs = function (version, urlOptions) {
    if (!version) {
      return Bluebird.reject(new errors.InvalidOption('version', 'required'));
    }

    var srcSignedURLPromise = urlOptions.src ?
      projectVersionCtrl.getSrcSignedURL(
        version,
        urlOptions.src.action,
        urlOptions.src.expiresIn,
        urlOptions.src.promptSaveAs
      ) :
      undefined;

    var distSignedURLPromise = urlOptions.dist ?
      projectVersionCtrl.getDistSignedURL(
        version,
        urlOptions.dist.action,
        urlOptions.dist.expiresIn,
        urlOptions.dist.promptSaveAs
      ) :
      undefined;

    return Bluebird.all([
      srcSignedURLPromise,
      distSignedURLPromise
    ])
    .then((signedURLs) => {
      return {
        src: signedURLs[0],
        dist: signedURLs[1]
      };
    });
  };

  /**
   * Removes the storage files for the version
   * 
   * @param  {ProjectVersion} version
   * @return {Bluebird -> ProjectVersion}
   */
  projectVersionCtrl.delete = function (version) {

    if (!(version instanceof ProjectVersion)) {
      return Bluebird.reject(new errors.InvalidOption('version', 'typeerror'));
    }

    var srcStorage = version.get('srcStorage');

    if (!srcStorage) {
      return Bluebird.reject(new errors.InvalidOption('version.srcStorage', 'required'));
    }

    // GCS is the only supported srcStorage provider at the moment
    if (srcStorage.provider !== 'GCS') {
      return Bluebird.reject(new errors.InvalidOption('project.srcStorage.provider', 'unsupported'));
    }

    var gcsSrcFile = app.services.gcs.file(srcStorage._id);

    return new Bluebird((resolve, reject) => {
      gcsSrcFile.delete((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    })
    .then(() => {
      if (version.getBuildStatus() === app.constants.BUILD_STATUSES.SUCCEEDED) {
        var gcsDistFile = app.services.gcs.file(version.distStorage._id);

        return new Bluebird((resolve, reject) => {
          gcsDistFile.delete((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
    });
  };

  /**
   * Lists projectVersions related to a project
   * 
   * @param  {Project} project
   * @return {Bluebird -> Array[ProjectVersion]}        
   */
  projectVersionCtrl.listByProject = function (project) {
    if (!(project instanceof Project)) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required', 'project must be instanceof Project'));
    }

    var query = {
      projectId: project.get('_id'),
    };

    return ProjectVersion.find(query);
  };

  projectVersionCtrl.getByProjectAndCode = function (project, versionCode) {
    if (!(project instanceof Project)) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required', 'project must be instanceof Project'));
    }

    if (!versionCode) {
      return Bluebird.reject(new errors.InvalidOption('versionCode', 'required'));
    }

    return ProjectVersion.findOne({
      projectId: project._id,
      code: versionCode
    })
    .then((version) => {
      if (!version) {
        return Bluebird.reject(new errors.NotFound());
      } else {
        return version;
      }
    });
  };

  /**
   * Retrieves the latest version of the given project
   * 
   * @param  {Project} project
   * @return {Bluebird -> ProjectVersion}
   */
  projectVersionCtrl.getProjectLatest = function (project) {
    if (!(project instanceof Project)) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required', 'project must be instanceof Project'));
    }

    var query = {
      projectId: project._id
    };

    var options = {
      sort: {
        createdAt: -1 // Sort by `createdAt` DESC
      }
    };

    return ProjectVersion.findOne(
      query,
      null,
      options
    )
    .then((version) => {
      if (!version) {
        return Bluebird.reject(new errors.NotFound());
      } else {
        return version;
      }
    });

  };

  /**
   * Restores a given version, which means to
   * make a copy of the given version and put it
   * at the latest position.
   * 
   * @param  {Project} project
   * @param  {String} versionCode
   * @return {Blubird -> ProjectVersion}
   */
  projectVersionCtrl.restore = function (project, versionCode) {
    if (!(project instanceof Project)) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required', 'project must be instanceof Project'));
    }

    if (!versionCode) {
      return Bluebird.reject(new errors.InvalidOption('versionCode', 'required'));
    }

    // first retrieve the fromVersion
    return projectVersionCtrl.getByProjectAndCode(project, versionCode)
      .then((fromVersion) => {

        /**
         * DESIGN DECISION:
         * We could've implemented the restore feature by copying
         * files with the gcs.file#copy method instead, but that
         * would leave all the rest of the version creation workflow (number and code setting)
         * for us, which might generate errors.
         *
         * Though this might be inefficient, as the file is transferred to
         * our servers and then to GCS again and all the build process has to be
         * re-run, it is much easier to reason about and generates no code repetition.
         *
         * Do not optimize prematurely. But in case we face scalability issues
         * on `restore` (which I quite doubt), we might need to
         * have re-implement this method.
         */

        var fromSrcFile = app.services.gcs.file(fromVersion.srcStorage._id, {
          generation: fromVersion.srcStorage.generation
        });
        var fromSrcReadStream = fromSrcFile.createReadStream();

        return projectVersionCtrl.create(project, fromSrcReadStream);
      });
  };

  return projectVersionCtrl;
};
