// third-party dependencies
const should = require('should');
const slug   = require('slug');

// auxiliary
const aux = require('../../aux');

const hProjectServer = require('../../../server');

describe('projectCtrl.create(userId, projectData)', function () {

  var ASSETS;

  beforeEach(function () {

    return aux.setup()
      .then((assets) => {

        ASSETS = assets;

        var options = aux.clone(aux.defaultOptions);

        ASSETS.hProject = hProjectServer(options);

        return ASSETS.hProject.ready;

      })
      .catch();
  });

  afterEach(function () {
    return aux.teardown();
  });

  it('should create a project', function () {
    return ASSETS.hProject.controllers.project.create('some-user-id', {
      name: 'Test Project'
    })
    .then((project) => {

      project.name.should.equal('Test Project');
      project.code.should.equal(slug('Test Project', { lower: true }));

      project.getStatus().should.eql('active');
      project.verifyPermissions('some-user-id', [
        'read',
        'update',
        'write',
        'delete'
      ])
      .should.eql(true);

    })
    .catch(aux.logError);
  });

  it('should require the subject identifier to be passed as the first argument', function () {
    return ASSETS.hProject.controllers.project.create(undefined, {
      name: 'Test Project',
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('userId');
      err.kind.should.equal('required');
    });
  });

  it('should require the projectData to have a `name` property', function () {
    return ASSETS.hProject.controllers.project.create('some-user-id', {
      // name: 'Test Project',
    })
    .then(aux.errorExpected, (err) => {
      err.name.should.equal('InvalidOption');
      err.option.should.equal('name');
      err.kind.should.equal('required');
    });
  });

  it('should create a new unique code if the first attempted code is in use', function () {
    var projectCtrl = ASSETS.hProject.controllers.project;
    return projectCtrl.create('some-user-id', {
      name: 'Test Project',
    })
    .then((project) => {
      project.code.should.equal('test-project');

      return projectCtrl.create('some-other-user-id', {
        name: 'Test Project'
      });
    })
    .then((project2) => {
      project2.code.should.not.equal('test-project');
      project2.code.startsWith('test-project').should.equal(true);
    });
  });

});
