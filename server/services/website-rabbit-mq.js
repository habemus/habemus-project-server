// third-party
const amqplib  = require('amqplib');
const Bluebird = require('bluebird');

module.exports = function (app, options) {

  const WEBSITE_RABBIT_MQ_URI = options.websiteRabbitMQURI;

  var websiteRabbitMQSvc = {};

  return Bluebird.resolve(amqplib.connect(WEBSITE_RABBIT_MQ_URI))
    .then((connection) => {

      websiteRabbitMQSvc.connection = connection;

      return websiteRabbitMQSvc;
    });
};
