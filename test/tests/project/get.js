// third-party dependencies
const should   = require('should');
const slug     = require('slug');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../aux');

const hProject = require('../../../server');

describe('projectCtrl get methods', function () {

  var ASSETS;

  beforeEach(function () {

    // rabbit mq takes 10000 ms to timeout connection by default
    this.timeout(11000);
    return aux.setup()
      .then((assets) => {

        ASSETS = assets;

        var options = aux.clone(aux.defaultOptions);

        ASSETS.hProject = hProject(options);

        return ASSETS.hProject.ready;

      })
      .then(() => {

        var user1Projects = ['Project 1', 'Project 2', 'Project 3'].map((name) => {
          return ASSETS.hProject.controllers.project.create('user-id-1', {
            name: name,
          });
        });

        var user2Projects = ['Project 4', 'Project 5', 'Project 6', 'Project 7'].map((name) => {
          return ASSETS.hProject.controllers.project.create('user-id-2', {
            name: name,
          });
        });

        // create some projects
        return Bluebird.all(user1Projects.concat(user2Projects));

      }).then((projects) => {

        ASSETS.projects = projects;
      });
  });

  afterEach(function () {
    this.timeout(4000);
    return aux.teardown();
  });

  describe('getByCode(code)', function () {

    it('should retrieve the project by its code', function () {
      return ASSETS.hProject.controllers.project
        .getByCode(ASSETS.projects[0].code)
        .then((project) => {
          project.code.should.equal(ASSETS.projects[0].code);
          project.name.should.equal(ASSETS.projects[0].name);
        });
    });

    it('should require `code` as the first argument', function () {
      return ASSETS.hProject.controllers.project
        .getByCode(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('code');
          err.kind.should.equal('required');
        });
    });
  });

  describe('getById(projectId)', function () {

    it('should retrieve the project by its projectId', function () {
      return ASSETS.hProject.controllers.project
        .getById(ASSETS.projects[0]._id)
        .then((project) => {
          project._id.should.equal(ASSETS.projects[0]._id);
          project.name.should.equal(ASSETS.projects[0].name);
        });
    });

    it('should require `projectId` as the first argument', function () {
      return ASSETS.hProject.controllers.project
        .getById(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('projectId');
          err.kind.should.equal('required');
        });
    });

    it('should reject with NotFound in case no project is found with the given _id', function () {
      return ASSETS.hProject.controllers.project
        .getById('fake-project-id')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('NotFound');
        });
    });
  });

  describe('list(userId, query)', function () {
    it('should list projects scoped by userId', function () {
      return ASSETS.hProject.controllers.project
        .listUserProjects('user-id-1')
        .then((projects) => {
          projects.length.should.equal(3);

          projects.forEach((proj) => {
            ['project-1', 'project-2', 'project-3']
              .indexOf(proj.code)
              .should.not.equal(-1);
          });


          // list user-2
          return ASSETS.hProject.controllers.project.listUserProjects('user-id-2');
        })
        .then((u2projects) => {
          u2projects.length.should.equal(4);
          u2projects.forEach((proj) => {
            ['project-4', 'project-5', 'project-6', 'project-7']
              .indexOf(proj.code)
              .should.not.equal(-1);
          });

          // list fake-user
          return ASSETS.hProject.controllers.project.listUserProjects('fake-user');
        })
        .then((fakeUserProjects) => {
          fakeUserProjects.length.should.equal(0);
        });
    });

    it('should require userId as the first argument', function () {
      return ASSETS.hProject.controllers.project
        .listUserProjects(undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('userId');
          err.kind.should.equal('required');
        });
    });
  });

});
