// third-party
const Bluebird = require('bluebird');

const WebsiteBuilderHTML5 = require('habemus-website-builder-html5/client');

module.exports = function (app, options) {

  var hBuilderHTML5 = new WebsiteBuilderHTML5();

  return hBuilderHTML5.connect(app.services.rabbitMQ.connection)
    .then(() => {

      hBuilderHTML5.on('result:success', function (buildRequestId, report) {
        app.controllers.projectVersion.handleBuildSuccess(buildRequestId, report);
      });
      hBuilderHTML5.on('result:error', function (buildRequestId, report) {

        app.services.log.error('build failed', buildRequestId, report);

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
