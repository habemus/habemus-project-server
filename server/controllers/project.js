// third-party dependencies
const slug     = require('slug');
const Bluebird = require('bluebird');

const CODE_MAX_RETRIES = 5;
const ALLOW_UPDATE = [
  'name',
];

module.exports = function (app, options) {

  const errors = app.errors;

  const Project = app.services.mongoose.models.Project;
  
  var projectCtrl = {};

  /**
   * Creates a new project
   * @param  {String} userId
   * @param  {Object} projectData
   *         - name
   * @return {Bluebird -> project}
   */
  projectCtrl.create = function (userId, projectData) {

    if (!userId) {
      return Bluebird.reject(new errors.InvalidOption('userId', 'required', 'userId is required for verification'));
    }
    
    if (!projectData || !projectData.name) {
      return Bluebird.reject(new errors.InvalidOption('name', 'required', '`name` is required'));
    }

    // make sure there is a code
    var code = slug(projectData.name, {
      lower: true,
    });

    var project = new Project(projectData);

    /**
     * Set the status to 'active'
     */
    project.setStatus(app.constants.PROJECT_STATUSES.ACTIVE, 'NewlyCreated');

    /**
     * Grant the owner all valid permissions
     */
    project.grant(userId, app.constants.VALID_PROJECT_PERMISSIONS);

    return project.saveRetryCode(code, CODE_MAX_RETRIES);
  };

  /**
   * Marks the project for removal.
   *
   * The project's status is changed to 'SCHEDULED_FOR_REMOVAL'
   * which, to the user, is equivalent to a removed project.
   * The removal does not take place immediately, but is run by a worker
   * which removes all storage files related to the project
   * and communicates all other services about the project removal.
   *
   * The database entry is only fully removed after all resources allocated
   * to the project have been successfully removed.
   * 
   * @param  {Project} project
   * @param  {String} reason
   * @return {Bluebird -> undefined}
   */
  projectCtrl.scheduleRemoval = function (project, reason) {
    if (!(project instanceof Project)) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required', 'project is required for verification'));
    }
    
    if (!reason) {
      return Bluebird.reject(new errors.InvalidOption('reason', 'required', 'reason is required for verification'));
    }

    /**
     * Set status
     */
    project.setStatus(app.constants.PROJECT_STATUSES.SCHEDULED_FOR_REMOVAL, reason);

    return project.save().then(() => {
      return;
    });
  };

  /**
   * Lists the projects available to the user.
   * Projects which statuses are 'SCHEDULED_FOR_REMOVAL'
   * do not show up.
   *
   * Requires userId because the results are always scoped
   * by user
   * 
   * Only returns projects that the given user has 'read' access
   * 
   * @param  {String} userId
   * @param  {Object} query
   * @return {Promise -> Array[Project]}
   */
  projectCtrl.listUserProjects = function (userId, query) {

    if (!userId) {
      return Bluebird.reject(new errors.InvalidOption('userId', 'required', 'userId is required'));
    }

    query = query || {};

    /**
     * Find projects to which the given userId has read permissions
     */
    Project.scopeQueryByPermissions(query, userId, [
      app.constants.PROJECT_PERMISSIONS.READ
    ]);

    Project.scopeQueryByStatuses(query, [
      app.constants.PROJECT_STATUSES.ACTIVE,
    ]);

    return Project.find(query);
  };

  /**
   * Retrieves a project by its code
   * 
   * @param  {String} code
   * @return {Bluebird -> Project}
   */
  projectCtrl.getByCode = function (code) {
    if (!code) {
      return Bluebird.reject(new errors.InvalidOption('code', 'required', 'code is required'));
    }

    var query = { code: code };

    // only active projects
    Project.scopeQueryByStatuses(query, [
      app.constants.PROJECT_STATUSES.ACTIVE
    ]);

    return Project.findOne(query).then(function (project) {
      
      if (!project) {
        return Bluebird.reject(new errors.NotFound('project', code));
      }
      
      return project;
    });

  };

  /**
   * Retrieves a project by its immutable id
   * 
   * @param  {String} id
   * @return {Bluebird -> Project}
   */
  projectCtrl.getById = function (projectId) {
    if (!projectId) {
      return Bluebird.reject(new errors.InvalidOption('projectId', 'required', 'projectId is required'));
    }

    var query = { _id: projectId };

    // only active projects
    Project.scopeQueryByStatuses(query, [
      app.constants.PROJECT_STATUSES.ACTIVE
    ]);

    return Bluebird.resolve(Project.findOne(query)).then((project) => {
      
      if (!project) {
        return Bluebird.reject(new errors.NotFound('project', projectId));
      }

      return project;
    });
  };

  /**
   * Updates a project's data.
   * Ignores code update requests.
   * code's must be updated separately.
   * 
   * @param  {Project} project
   * @param  {Object} updateData
   * @return {Bluebird -> Project}
   */
  projectCtrl.update = function (project, updateData) {
    if (!(project instanceof Project)) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required'));
    }

    if (!updateData) {
      return Bluebird.reject(new errors.InvalidOption('updateData', 'required'));
    }

    /**
     * Pick data that is allowed to be updated
     */
    var _updateData = ALLOW_UPDATE.reduce((res, prop) => {

      if (updateData.hasOwnProperty(prop)) {
        res[prop] = updateData[prop];
      }

      return res;
    }, {});

    project.set(_updateData);

    return Bluebird.resolve(project.save());
  };

  /**
   * Updates a project's code
   * 
   * @param  {Project} project
   * @param  {String} targetCode
   * @return {Bluebird -> Project}
   */
  projectCtrl.updateCode = function (project, targetCode) {

    if (!(project instanceof Project)) {
      return Bluebird.reject(new errors.InvalidOption('project', 'required'));
    }

    if (typeof targetCode !== 'string') {
      return Bluebird.reject(new errors.InvalidOption('targetCode', 'typeerror'));
    }

    // make sure the targetCode is a slug and is lowercase
    targetCode = slug(targetCode, {
      lower: true,
    });
    
    return project.saveRetryCode(targetCode, CODE_MAX_RETRIES)
      .then((project) => {

        /**
         * Schedule a deploy of the project
         * DO NOT wait for the schedule promise.
         */
        app.services.hWebsiteDeployer.schedule({
          project: project
        });

        return project;
      });
  };
  
  return projectCtrl;
};