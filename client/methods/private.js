// third-party
const superagent = require('superagent');
const Bluebird   = require('bluebird');

exports.verifyProjectPermissions = function (authToken, subject, projectId, permissions) {

  return this._authReq(
    'GET',
    '/project/' + projectId + '/verify-permissions',
    {
      authToken: authToken,
      query: {
        subject: subject,
        permissions: permissions,
      }
    }
  )
};