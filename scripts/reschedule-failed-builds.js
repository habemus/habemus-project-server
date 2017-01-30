// third-party
const Bluebird = require('bluebird');

var hProject = require('./h-project-instance');

return hProject.ready.then(() => {

  var ProjectVersion = hProject.services.mongoose.models.ProjectVersion;

  var query = {};

  ProjectVersion.scopeQueryByBuildStatuses(query, [
    hProject.constants.BUILD_STATUSES.FAILED,
  ]);

  return ProjectVersion.find(query).limit(10).exec().then((projectVersions) => {

    return Bluebird.all(projectVersions.map((pv) => {
      return hProject.controllers.projectVersion.scheduleBuild(pv);
    }));

  })
})
.then((versions) => {
  console.log('scheduled build for versions ', JSON.stringify(versions, null '  '));
})
.catch((err) => {
  console.warn('error', err);
});
