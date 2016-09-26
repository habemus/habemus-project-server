// native
const crypto = require('crypto');

// third-party
const multer         = require('multer');
const filesizeParser = require('filesize-parser');

const aux = require('./auxiliary');

module.exports = function (app, options) {
  const MAX_UPLOAD_SIZE = (typeof options.maxProjectFileSize === 'string') ?
    filesizeParser(options.maxProjectFileSize) :
    options.maxProjectFileSize;

  if (!MAX_UPLOAD_SIZE) {
    throw new app.errors.InvalidOption('maxProjectFileSize', 'required');
  }

  /**
   * Option used to evaluate the project
   * @type {Function}
   */
  var _getProject = options.project || function (req) {
    return req.project;
  };

  /**
   * The storage engine to be used
   * https://github.com/expressjs/multer/blob/master/StorageEngine.md
   * @type {Object}
   */
  var multerStorage = {
    _handleFile: function (req, incomingFile, cb) {

      var project = _getProject(req);

      app.controllers.projectVersion.create(project, incomingFile.stream)
        .then((projectVersion) => {
          cb(null, projectVersion);
        })
        .catch(cb);
    },
    _removeFile: function (req, projectVersion, cb) {

      app.controllers.projectVersion.delete(projectVersion)
        .then(() => {
          cb(null);
        })
        .catch(cb);
    },
  };

  /**
   * The actual middleware
   */
  var multerUpload = multer({
    // as the storage logic is closely tied to 
    storage: multerStorage,
    limits: {
      fieldNameSize: 100,
      // For multipart forms, the max file size (in bytes)
      // '50MB' = 52428800
      fileSize: MAX_UPLOAD_SIZE,
      files: 1,
    }
  }).single('file');

  return function (req, res, next) {
    multerUpload(req, res, function (err) {
      if (err) {

        if (err.code === 'LIMIT_FILE_SIZE') {
          next(new app.errors.MaxFilesizeExceeded(MAX_UPLOAD_SIZE));
        } else {
          next(err);
        }
      } else {
        next();
      }
    });
  }
};
