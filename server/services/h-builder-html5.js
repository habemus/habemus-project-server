// third-party
const Bluebird = require('bluebird');

const HBuilderHTML5Client = require('h-builder-html5/client');

module.exports = function (app, options) {

  var hBuilderHTML5 = new HBuilderHTML5Client();

  return hBuilderHTML5.connect(app.services.rabbitMQ.connection)
    .then(() => {
      app.services.hBuilderHTML5 = hBuilderHTML5;

      hBuilderHTML5.on('result:success', function (buildRequestId, report) {
        app.controllers.projectVersion.handleBuildSuccess(buildRequestId, report);
      });
      hBuilderHTML5.on('result:error', function (buildRequestId, report) {
        app.controllers.projectVersion.handleBuildFailure(buildRequestId, report);
      });

      // hBuilderHTML5.on('workload-log:info', function (buildRequestId, report) {

      // });

      // hBuilderHTML5.on('workload-log:warning', function (buildRequestId, report) {

      // });

      // hBuilderHTML5.on('workload-log:error', function (buildRequestId, report) {

      // });

      return hBuilderHTML5;
    });
};
