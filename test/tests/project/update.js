// third-party dependencies
const should   = require('should');
const slug     = require('slug');
const Bluebird = require('bluebird');

// auxiliary
const aux = require('../../aux');

const hProject = require('../../../server');

describe('projectCtrl update methods', function () {

  var ASSETS;

  beforeEach(function (done) {

    // rabbit mq takes 10000 ms to timeout connection by default
    this.timeout(11000);

    aux.setup()
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

        done();
      })
      .catch(done);
  });

  afterEach(function (done) {
    this.timeout(4000);
    aux.teardown().then(done).catch(done);
  });

  describe('projectCtrl.update(identity, project, projectData)', function () {

    it('should update a project\'s data', function () {
      return ASSETS.hProject.controllers.project
        .update(ASSETS.projects[0], {
          name: 'New Project name'
        })
        .then(() => {
          arguments.length.should.equal(0);

          return ASSETS.hProject.controllers.project
            .getByCode(ASSETS.projects[0].code);
        })
        .then((project) => {
          project.name.should.equal('New Project name');

          // code remains the same
          project.code.should.equal(ASSETS.projects[0].code);
        });
    });

    it('should ignore `code` update', function () {
      return ASSETS.hProject.controllers.project
        .update(ASSETS.projects[0], {
          code: 'new-project-code'
        })
        .then((project) => {

          // code should have remained the same
          project.code.should.equal('project-1');
        });
    });

    it('should ignore `acls` update', function () {
      return ASSETS.hProject.controllers.project
        .update(ASSETS.projects[0], {
          acls: {
            admin: 'another-user',
          }
        })
        .then((project) => {
          should(project.acls.admin).eql(undefined);
        });
    });

    it('should require project as the first argument', function () {
      return ASSETS.hProject.controllers.project
        .update(undefined, {
          name: 'Another Name',
        })
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('project');
          err.kind.should.equal('required');
        });
    });

  });

  describe('projectCtrl.updateCode(identity, project, targetCode)', function () {
    it('should update the project\'s code', function () {
      return ASSETS.hProject.controllers.project
        .updateCode(ASSETS.projects[0], 'new-code')
        .then(() => {
          arguments.length.should.equal(0);

          return ASSETS.hProject.controllers.project
            .getByCode('new-code');
        })
        .then((project) => {
          project.code.should.equal('new-code');
        });
    });

    it('should ensure the new code is a lowercase', function () {
      return ASSETS.hProject.controllers.project
        .updateCode(ASSETS.projects[0], 'NEW CODE')
        .then(() => {
          return ASSETS.hProject.services.mongoose.models.Project.findOne({
            _id: ASSETS.projects[0]._id
          });
        })
        .then((project) => {
          project.code.should.equal('new-code');
        });
    });

    it('should ensure the new code to have at most 63 characters', function () {

      var projectCode = 'VeryVeryVeryVeryLongCodkl jqwlkej klqwjekwqkwjekqjwee nqkjweh qwhejkqwhe kjqwhejkhq jkrhqwkjehjqw e';

      return ASSETS.hProject.controllers.project
        .updateCode(ASSETS.projects[0], projectCode)
        .then(() => {
          return ASSETS.hProject.services.mongoose.models.Project.findOne({
            _id: ASSETS.projects[0]._id
          });
        })
        .then((project) => {
          project.code.length.should.equal(63);
        });
    });

    it('should require project as the first argument', function () {
      return ASSETS.hProject.controllers.project
        .updateCode(undefined, 'new-code')
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('project');
          err.kind.should.equal('required');
        });
    });

    it('should require targetCode as the second argument', function () {
      return ASSETS.hProject.controllers.project
        .updateCode(ASSETS.projects[0], undefined)
        .then(aux.errorExpected, (err) => {
          err.name.should.equal('InvalidOption');
          err.option.should.equal('targetCode');
          err.kind.should.equal('typeerror');
        });
    });
  });

});
