// native
const crypto = require('crypto');

// third-party dependencies
const Bluebird = require('bluebird');
const request  = require('request');

// constants
const SRC_SIGNED_URL_ACTIONS = ['read'];
const DIST_SIGNED_URL_ACTIONS = ['read', 'write'];

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
  projectVersionCtrl.create = function (project, source) {

    if (!(project instanceof Project) || !project._id) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required'));
    }

    if (!source) {
      return Bluebird.reject(new errors.InvalidOption('source', 'required'));
    }

    /**
     * Assume that if the source is a String, it is a url from which to
     * download the zip files.
     *
     * Otherwise assume it is a readable stream.
     * 
     * @type {ReadableStream}
     */
    var readStream = (typeof source === 'string') ? request(source) : source;

    var gcsFile        = app.services.gcs.file(project._id);
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

      gcsWriteStream.on('error', (err) => {
        app.services.logging.error('upload gcsWriteStream error', err);
        reject(new errors.UploadFailed());
      });

      gcsWriteStream.on('finish', () => {
        app.services.logging.info('upload finished');

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

      _version.set('srcStorage', {
        _id: gcsFile.name,
        provider: 'GCS',
        generation: gcsFile.metadata.generation,
        meta: {
          checksum: _checksum,
        }
      });

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

    if (srcStorage.provider !== 'GCS') {
      return Bluebird.reject(new errors.InvalidOption('project.srcStorage.provider', 'unsupported'));
    }

    // GCS is the only supported srcStorage provider at the moment
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
      var distStorage = version.get('distStorage');
      if (distStorage) {
        var gcsDistFile = app.services.gcs.file(distStorage._id);

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

  projectVersionCtrl.listByProject = function (project) {
    if (!(project instanceof Project)) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required', 'project must be instanceof Project'));
    }

    var query = {
      projectId: project.get('_id'),
    };

    return ProjectVersion.find(query);
  };
};
