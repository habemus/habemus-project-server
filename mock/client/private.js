// third-party
const Bluebird = require('bluebird');

module.exports = function (mockOptions) {

  /**
   * Data objects to be used for performing mock operations
   * - projects
   * - projectVersions
   * @type {Object}
   */
  var mockData = mockOptions.data || DEFAULT_MOCK_DATA;

  if (!mockData.projects) {
    throw new Error('projects are required');
  }

  if (!mockData.projectVersions) {
    throw new Error('projectVersions are required');
  }

  // mock h-project/client/private module and make it respond with the correct data
  function PrivateHProjectMock(options) {}

  PrivateHProjectMock.prototype.getById = function (authToken, projectId, options) {

    return new Bluebird((resolve, reject) => {
      var proj = mockData.projects.find((proj) => {
        return (proj._id === projectId);
      });

      if (proj) {
        resolve(proj);
      } else {
        reject(new Error('NotFound'));
      }

    });
  };

  PrivateHProjectMock.prototype.getByCode = function (authToken, projectCode, options) {
    return new Bluebird((resolve, reject) => {
      var proj = mockData.projects.find((proj) => {
        return (proj.code === projectCode);
      });

      if (proj) {
        resolve(proj);
      } else {
        reject(new Error('NotFound'));
      }

    });
  };

  PrivateHProjectMock.prototype.getProjectVersion = function (authToken, projectId, versionCode, options) {

    return new Bluebird((resolve, reject) => {

      var version;

      if (versionCode) {
        version = mockData.projectVersions.find((version) => {
          return (version.projectId === projectId && version.code === versionCode);
        });

      } else {
        // latest version
        var projectVersions = mockData.projectVersions.filter((version) => {
          return version.projectId === projectId;
        });

        version = projectVersions[projectVersions.length - 1];
      }

      if (version) {
        resolve(version);
      } else {
        reject(new Error('NotFound'));
      }

    });
  };

  PrivateHProjectMock.prototype.verifyProjectPermissions = function () {

  };

  return PrivateHProjectMock;
}
