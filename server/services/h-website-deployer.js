// third-party
const Bluebird = require('bluebird');

const HWorkerClient = require('h-worker/client');

module.exports = function (app, options) {

  var hWebsiteDeployerClient = new HWorkerClient({
    name: 'h-website-deployer',
  });

  return hWebsiteDeployerClient.connect(app.services.rabbitMQ.connection)
    .then(() => {

      hWebsiteDeployerClient.on('result:success', function (buildRequestId, report) {
        console.log('deploy successful', arguments);
      });

      hWebsiteDeployerClient.on('result:error', function (buildRequestId, report) {

        console.log('deploy error', arguments);
      });

      return hWebsiteDeployerClient;
    });
};
