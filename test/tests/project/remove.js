// third-party dependencies
const should   = require('should');
const slug     = require('slug');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../aux');

const hProject = require('../../../server');

describe('projectCtrl.remove(project, reason)', function () {

  var ASSETS;

  beforeEach(function () {

    return aux.setup()
      .then((assets) => {

        ASSETS = assets;

        var options = aux.clone(aux.defaultOptions);

        ASSETS.hProject = hProject(options);

        return ASSETS.hProject.ready;

      })
      .then(() => {

        // create some projects
        return Bluebird.all(['Project 1', 'Project 2', 'Project 3'].map((name) => {
          return ASSETS.hProject.controllers.project.create('user-id-1', {
            name: name,
          });
        }));

      }).then((projects) => {

        ASSETS.projects = projects;
      });
  });

  afterEach(function () {
    return aux.teardown();
  });

  it('should set the project\'s status to `scheduled-for-removal`', function () {

    var projectCtrl = ASSETS.hProject.controllers.project;

    return projectCtrl
      .remove(ASSETS.projects[0], 'SomeReason')
      .then(() => {
        arguments.length.should.equal(0);

        return ASSETS.hProject.services.mongoose.models.Project.findOne({ code: ASSETS.projects[0].code });
      })
      .then((project) => {
        project.status.value.should.equal('scheduled-for-removal');
        project.status.reason.should.equal('SomeReason');
      });
  });

  it('should require project as the first argument', function () {
    return ASSETS.hProject.controllers.project
      .remove(
        undefined,
        'SomeReason'
      )
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('project');
        err.kind.should.equal('required');
      });
  });

  it('should require reason as the second argument', function () {
    return ASSETS.hProject.controllers.project
      .remove(
        ASSETS.projects[0],
        undefined
      )
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('InvalidOption');
        err.option.should.equal('reason');
        err.kind.should.equal('required');
      });
  });

  it('should prevent controller from listing the projext after removal', function () {
    return ASSETS.hProject.controllers.project
      .remove(
        ASSETS.projects[0],
        'SomeReason'
      )
      .then(() => {
        return ASSETS.hProject.controllers.project.listUserProjects('user-id-1');
      })
      .then((projects) => {
        projects.length.should.equal(2);

        projects.forEach((proj) => {
          proj.code.should.not.equal(ASSETS.projects[0].code);
        });
      });
  });

  it('should prevent the project from being getted after removal', function () {

    var projectCtrl = ASSETS.hProject.controllers.project;

    return projectCtrl
      .remove(ASSETS.projects[0], 'SomeReason')
      .then(() => {
        arguments.length.should.equal(0);

        // project should not be found by controller methods
        return projectCtrl.getByCode('user-id-1', ASSETS.projects[0].code);
      })
      .then(aux.errorExpected, (err) => {
        err.name.should.equal('NotFound');
      });
  });


});
