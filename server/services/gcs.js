// third-party
const Bluebird = require('bluebird');
const { Storage } = require('@google-cloud/storage');

module.exports = function (app, options) {

  return new Bluebird((resolve, reject) => {

    const gcs = new Storage({
      projectId: options.gcpProjectId,
      keyFilename: options.gcpKeyFilename,
    });

    const projectBucket = gcs.bucket(options.gcpBucket);
    
    resolve(projectBucket);
  });
};
