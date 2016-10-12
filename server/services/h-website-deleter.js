// third-party
const Bluebird = require('bluebird');

const HWorkerClient = require('h-worker/client');

module.exports = function (app, options) {

  var hWebsiteDeleterClient = new HWorkerClient({
    name: 'h-website-deleter',
  });

  return hWebsiteDeleterClient.connect(app.services.rabbitMQ.connection)
    .then(() => {

      hWebsiteDeleterClient.on('result:success', function (buildRequestId, report) {
        console.log('delete successful', arguments);
      });

      hWebsiteDeleterClient.on('result:error', function (buildRequestId, report) {

        console.log('delete error', arguments);
      });

      return hWebsiteDeleterClient;
    });
};
