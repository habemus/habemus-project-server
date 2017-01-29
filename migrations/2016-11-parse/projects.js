const rawProjects = require('./raw-data/Project.json').results;
const ownerJoins  = require('./raw-data/_Join:owners:Project.json').results;

var projects = rawProjects.map((project) => {

  var owners = ownerJoins.filter((join) => {
    return join.owningId === project._id;
  })
  .map((join) => {
    return join.relatedId;
  });

  if (owners.length === 0) {
    throw new Error('could not find owners for project ' + project._id);
  }

  project.owners = owners;

  return project;
});

module.exports = projects;
