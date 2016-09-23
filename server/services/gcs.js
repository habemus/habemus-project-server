// third-party
const Bluebird = require('bluebird');
const gcloud   = require('google-cloud');

module.exports = function (app, options) {

  return new Bluebird((resolve, reject) => {
    const gcs = gcloud.storage({
      projectId: options.gcpProjectId,
      keyFilename: options.gcpKeyFilename,
    });

    const projectBucket = gcs.bucket(options.gcpBucket);
    
    resolve(projectBucket);
  });
};
