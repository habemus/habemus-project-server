// third-party
const Bluebird = require('bluebird');

const AMQPWorkerClient = require('@habemus/amqp-worker/client');

module.exports = function (app, options) {

  var hWebsiteDeployerClient = new AMQPWorkerClient({
    name: 'h-website-deployer',
  });

  hWebsiteDeployerClient.scheduleDeploy = function (project) {

  };

  return hWebsiteDeployerClient.connect(app.services.websiteRabbitMQ.connection)
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
